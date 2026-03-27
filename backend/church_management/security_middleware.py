"""
Security middleware for rate limiting and request protection.
"""
import time
import hashlib
from functools import wraps

from django.http import JsonResponse
from django.core.cache import cache
from django.conf import settings


class RateLimitMiddleware:
    """
    Middleware to apply rate limiting to API requests.
    Uses Django cache to track request counts per IP.
    """

    def __init__(self, get_response):
        self.get_response = get_response
        # Rate limits: (requests, window_seconds)
        self.limits = {
            'login': (5, 300),        # 5 attempts per 5 minutes
            'register': (3, 3600),    # 3 attempts per hour
            'api': (100, 60),         # 100 requests per minute
            'sensitive': (10, 60),    # 10 requests per minute for sensitive endpoints
        }

    def __call__(self, request):
        # Skip rate limiting for health checks or certain paths
        if self._should_skip(request):
            return self.get_response(request)

        # Get client identifier (IP or user ID if authenticated)
        client_id = self._get_client_id(request)
        
        # Check rate limits
        limit_type = self._get_limit_type(request)
        if limit_type and self._is_rate_limited(client_id, limit_type):
            return JsonResponse(
                {'detail': 'Rate limit exceeded. Please try again later.'},
                status=429
            )

        response = self.get_response(request)
        
        # Add rate limit headers
        self._add_rate_limit_headers(response, client_id, limit_type)
        
        return response

    def _should_skip(self, request):
        """Check if request should skip rate limiting."""
        # Skip for admin interface
        if request.path.startswith('/admin/'):
            return True
        # Skip for static/media files
        if request.path.startswith(('/static/', '/media/')):
            return True
        # Skip for health check
        if request.path == '/health/':
            return True
        return False

    def _get_client_id(self, request):
        """Get unique identifier for the client."""
        # Use user ID if authenticated
        if hasattr(request, 'user') and request.user and request.user.is_authenticated:
            return f"user:{request.user.id}"
        
        # Otherwise use IP address
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0].strip()
        else:
            ip = request.META.get('REMOTE_ADDR', 'unknown')
        
        return f"ip:{ip}"

    def _get_limit_type(self, request):
        """Determine rate limit type based on request path."""
        path = request.path.lower()
        
        # Authentication endpoints
        if '/auth/' in path or '/login' in path or '/token' in path:
            return 'login'
        
        # Registration
        if '/register' in path or '/signup' in path:
            return 'register'
        
        # Sensitive financial operations
        if any(x in path for x in ['financial-transactions', 'payments', 'receipt']):
            return 'sensitive'
        
        # Default API limit
        if '/api/' in path:
            return 'api'
        
        return None

    def _is_rate_limited(self, client_id, limit_type):
        """Check if client has exceeded rate limit."""
        if limit_type not in self.limits:
            return False
        
        max_requests, window = self.limits[limit_type]
        cache_key = f"rate_limit:{limit_type}:{client_id}"
        
        # Get current request count
        data = cache.get(cache_key)
        now = time.time()
        
        if data is None:
            # First request
            cache.set(cache_key, {'count': 1, 'reset_time': now + window}, window)
            return False
        
        # Check if window has reset
        if now > data['reset_time']:
            cache.set(cache_key, {'count': 1, 'reset_time': now + window}, window)
            return False
        
        # Increment count
        data['count'] += 1
        remaining_time = int(data['reset_time'] - now)
        cache.set(cache_key, data, remaining_time)
        
        return data['count'] > max_requests

    def _add_rate_limit_headers(self, response, client_id, limit_type):
        """Add rate limit information to response headers."""
        if not limit_type or limit_type not in self.limits:
            return
        
        max_requests, window = self.limits[limit_type]
        cache_key = f"rate_limit:{limit_type}:{client_id}"
        data = cache.get(cache_key)
        
        if data:
            remaining = max(0, max_requests - data['count'])
            reset_time = int(data['reset_time'])
        else:
            remaining = max_requests
            reset_time = int(time.time() + window)
        
        response['X-RateLimit-Limit'] = str(max_requests)
        response['X-RateLimit-Remaining'] = str(remaining)
        response['X-RateLimit-Reset'] = str(reset_time)


class SecurityHeadersMiddleware:
    """
    Middleware to add security headers to all responses.
    """

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        response = self.get_response(request)
        
        # Security headers
        response['X-Content-Type-Options'] = 'nosniff'
        response['X-Frame-Options'] = 'DENY'
        response['X-XSS-Protection'] = '1; mode=block'
        response['Referrer-Policy'] = 'strict-origin-when-cross-origin'
        
        # Content Security Policy (CSP)
        csp_directives = [
            "default-src 'self'",
            "script-src 'self' 'unsafe-inline'",  # Allow inline scripts for React
            "style-src 'self' 'unsafe-inline' https:",  # Allow inline styles and external fonts
            "img-src 'self' data: https:",
            "font-src 'self' https: data:",
            "connect-src 'self'",
            "frame-ancestors 'none'",
            "base-uri 'self'",
            "form-action 'self'",
        ]
        response['Content-Security-Policy'] = '; '.join(csp_directives)
        
        # Strict Transport Security (HSTS) - only in production
        if not getattr(settings, 'DEBUG', True):
            response['Strict-Transport-Security'] = 'max-age=31536000; includeSubDomains; preload'
        
        # Permissions Policy
        response['Permissions-Policy'] = 'geolocation=(), microphone=(), camera=()'
        
        return response


def rate_limit_by_ip(max_requests=100, window=60):
    """
    Decorator to apply rate limiting to specific views.
    
    Usage:
        @rate_limit_by_ip(max_requests=5, window=300)
        def my_view(request):
            ...
    """
    def decorator(view_func):
        @wraps(view_func)
        def _wrapped_view(request, *args, **kwargs):
            # Get client IP
            x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
            if x_forwarded_for:
                ip = x_forwarded_for.split(',')[0].strip()
            else:
                ip = request.META.get('REMOTE_ADDR', 'unknown')
            
            cache_key = f"view_rate_limit:{view_func.__name__}:{ip}"
            now = time.time()
            
            # Get current count
            data = cache.get(cache_key)
            if data is None:
                cache.set(cache_key, {'count': 1, 'reset_time': now + window}, window)
                return view_func(request, *args, **kwargs)
            
            if now > data['reset_time']:
                cache.set(cache_key, {'count': 1, 'reset_time': now + window}, window)
                return view_func(request, *args, **kwargs)
            
            data['count'] += 1
            remaining_time = int(data['reset_time'] - now)
            cache.set(cache_key, data, remaining_time)
            
            if data['count'] > max_requests:
                return JsonResponse(
                    {'detail': f'Too many requests. Limit: {max_requests} per {window} seconds.'},
                    status=429
                )
            
            return view_func(request, *args, **kwargs)
        return _wrapped_view
    return decorator
