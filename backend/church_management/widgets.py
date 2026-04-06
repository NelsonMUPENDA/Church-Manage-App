# widgets.py - Widgets personnalisés pour l'admin Django
import json
from django import forms
from django.utils.html import format_html
from django.utils.safestring import mark_safe


class ServiceTimesWidget(forms.Widget):
    """Widget personnalisé pour saisir les horaires de culte en format JSON"""
    template_name = 'admin/widgets/service_times_widget.html'
    
    def render(self, name, value, attrs=None, renderer=None):
        if value is None:
            value = []
        elif isinstance(value, str):
            try:
                value = json.loads(value)
            except json.JSONDecodeError:
                value = []
        
        if not isinstance(value, list):
            value = []
        
        # Générer le HTML pour le widget
        html = '''
        <div class="service-times-widget" style="border: 1px solid #ccc; padding: 10px; border-radius: 4px; background: #f9f9f9;">
            <div id="service-times-list-%(name)s" style="margin-bottom: 10px;">
        ''' % {'name': name}
        
        for i, service in enumerate(value):
            html += self._render_service_row(name, i, service)
        
        html += '''
            </div>
            <button type="button" class="button" onclick="addServiceTime_%(name)s()" style="margin-top: 5px;">
                + Ajouter un horaire
            </button>
            <input type="hidden" name="%(name)s" id="id_%(name)s" value='%(value)s' />
        </div>
        
        <script>
        function addServiceTime_%(name)s() {
            const container = document.getElementById('service-times-list-%(name)s');
            const count = container.children.length;
            const newRow = document.createElement('div');
            newRow.className = 'service-time-row';
            newRow.style.cssText = 'display: flex; gap: 8px; margin-bottom: 8px; align-items: center;';
            newRow.innerHTML = `
                <input type="text" placeholder="Jour (ex: Dimanche)" class="vTextField" style="flex: 1;" data-field="day">
                <input type="text" placeholder="Heure (ex: 9h00 - 12h00)" class="vTextField" style="flex: 1;" data-field="time">
                <input type="text" placeholder="Nom (ex: Culte Dominical)" class="vTextField" style="flex: 1;" data-field="name">
                <button type="button" class="button" onclick="this.parentElement.remove(); updateServiceTimes_%(name)s();" style="background: #ba2121; color: white;">✕</button>
            `;
            container.appendChild(newRow);
            
            // Ajouter les écouteurs d'événements
            const inputs = newRow.querySelectorAll('input');
            inputs.forEach(input => {
                input.addEventListener('change', updateServiceTimes_%(name)s);
                input.addEventListener('keyup', updateServiceTimes_%(name)s);
            });
        }
        
        function updateServiceTimes_%(name)s() {
            const container = document.getElementById('service-times-list-%(name)s');
            const rows = container.querySelectorAll('.service-time-row');
            const services = [];
            
            rows.forEach(row => {
                const day = row.querySelector('[data-field=\"day\"]').value.trim();
                const time = row.querySelector('[data-field=\"time\"]').value.trim();
                const name = row.querySelector('[data-field=\"name\"]').value.trim();
                
                if (day || time || name) {
                    services.push({ day: day, time: time, name: name });
                }
            });
            
            document.getElementById('id_%(name)s').value = JSON.stringify(services);
        }
        
        // Initialiser les écouteurs pour les lignes existantes
        document.addEventListener('DOMContentLoaded', function() {
            const container = document.getElementById('service-times-list-%(name)s');
            const inputs = container.querySelectorAll('input');
            inputs.forEach(input => {
                input.addEventListener('change', updateServiceTimes_%(name)s);
                input.addEventListener('keyup', updateServiceTimes_%(name)s);
            });
        });
        </script>
        ''' % {'name': name, 'value': json.dumps(value)}
        
        return mark_safe(html)
    
    def _render_service_row(self, name, index, service):
        day = service.get('day', '') if isinstance(service, dict) else ''
        time = service.get('time', '') if isinstance(service, dict) else ''
        service_name = service.get('name', '') if isinstance(service, dict) else ''
        
        return '''
        <div class="service-time-row" style="display: flex; gap: 8px; margin-bottom: 8px; align-items: center;">
            <input type="text" placeholder="Jour (ex: Dimanche)" class="vTextField" style="flex: 1;" 
                   value="%(day)s" data-field="day">
            <input type="text" placeholder="Heure (ex: 9h00 - 12h00)" class="vTextField" style="flex: 1;" 
                   value="%(time)s" data-field="time">
            <input type="text" placeholder="Nom (ex: Culte Dominical)" class="vTextField" style="flex: 1;" 
                   value="%(name)s" data-field="name">
            <button type="button" class="button" onclick="this.parentElement.remove(); updateServiceTimes_%(field_name)s();" 
                    style="background: #ba2121; color: white;">✕</button>
        </div>
        ''' % {
            'day': day,
            'time': time,
            'name': service_name,
            'field_name': name
        }
    
    def value_from_datadict(self, data, files, name):
        value = data.get(name)
        if value:
            try:
                return json.loads(value)
            except json.JSONDecodeError:
                return []
        return []
