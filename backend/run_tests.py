#!/usr/bin/env python
"""
Test runner script for church_management tests.

Usage:
    python run_tests.py                    # Run all tests
    python run_tests.py -v                 # Run with verbose output
    python run_tests.py --coverage         # Run with coverage report
    python run_tests.py test_core          # Run specific test file
    python run_tests.py -m unit            # Run only unit tests
    python run_tests.py -m "not slow"      # Skip slow tests
"""
import sys
import subprocess
import argparse


def main():
    parser = argparse.ArgumentParser(description='Run church_management tests')
    parser.add_argument('-v', '--verbose', action='store_true', help='Verbose output')
    parser.add_argument('--coverage', action='store_true', help='Run with coverage')
    parser.add_argument('-m', '--marker', help='Run tests with specific marker (e.g., unit, integration)')
    parser.add_argument('test_path', nargs='?', help='Specific test file or path')

    args = parser.parse_args()

    # Build pytest command
    cmd = ['pytest']

    if args.verbose:
        cmd.append('-v')

    if args.coverage:
        cmd.extend(['--cov=church_management', '--cov-report=html', '--cov-report=term'])

    if args.marker:
        cmd.extend(['-m', args.marker])

    if args.test_path:
        cmd.append(f'church_management/tests/{args.test_path}')
    else:
        cmd.append('church_management/tests/')

    # Set Django settings module
    env = {
        'DJANGO_SETTINGS_MODULE': 'settings',
        'PYTHONPATH': '.',
    }

    print(f"Running: {' '.join(cmd)}")
    print(f"Environment: {env}")
    print("-" * 50)

    result = subprocess.run(cmd, env={**env, **dict(subprocess.os.environ)})
    return result.returncode


if __name__ == '__main__':
    sys.exit(main())
