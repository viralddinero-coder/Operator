import React, { useState, useEffect } from 'react';
import { MessageSquare, Save, Plus, Edit3, Trash2, Copy } from 'lucide-react';
import { templateService } from '../../services/api';
import { MessageTemplate } from '../../types';

export default function MessageTemplates() {
  const [templates, setTemplates] = useState<MessageTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<MessageTemplate | null>(null);
  
  const [formData, setFormData] = useState({
    name: '',
    subject: '',
    content: '',
    template_type: 'welcome' as 'welcome' | 'promotional' | 'seasonal' | 'system',
    is_active: true,
    variables: ''
  });

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      const { templates: data, error } = await templateService.getMessageTemplates();
      if (!error) {
        setTemplates(data || []);
      }
    } catch (error) {
      console.error('Error loading templates:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!formData.name || !formData.subject || !formData.content) {
      alert('Vänligen fyll i namn, ämne och innehåll');
      return;
    }

    try {
      const templateData = {
        ...formData,
        variables: formData.variables ? formData.variables.split(',').map(v => v.trim()) : []
      };

      if (editingTemplate) {
        const { error } = await templateService.updateMessageTemplate(editingTemplate.id, templateData);
        if (error) {
          alert('Fel vid uppdatering av mall: ' + error.message);
          return;
        }
      } else {
        const { error } = await templateService.createMessageTemplate(templateData);
        if (error) {
          alert('Fel vid skapande av mall: ' + error.message);
          return;
        }
      }

      alert('Mall sparad framgångsrikt!');
      setShowModal(false);
      resetForm();
      loadTemplates();
    } catch (error) {
      alert('Fel vid sparande av mall');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Är du säker på att du vill ta bort denna mall?')) {
      return;
    }

    try {
      const { error } = await templateService.deleteMessageTemplate(id);
      if (error) {
        alert('Fel vid borttagning av mall: ' + error.message);
      } else {
        loadTemplates();
      }
    } catch (error) {
      alert('Fel vid borttagning av mall');
    }
  };

  const handleEdit = (template: MessageTemplate) => {
    setEditingTemplate(template);
    setFormData({
      name: template.name,
      subject: template.subject,
      content: template.content,
      template_type: template.template_type,
      is_active: template.is_active,
      variables: template.variables?.join(', ') || ''
    });
    setShowModal(true);
  };

  const handleDuplicate = (template: MessageTemplate) => {
    setEditingTemplate(null);
    setFormData({
      name: template.name + ' (Kopia)',
      subject: template.subject,
      content: template.content,
      template_type: template.template_type,
      is_active: false,
      variables: template.variables?.join(', ') || ''
    });
    setShowModal(true);
  };

  const resetForm = () => {
    setEditingTemplate(null);
    setFormData({
      name: '',
      subject: '',
      content: '',
      template_type: 'welcome',
      is_active: true,
      variables: ''
    });
  };

  const getTemplateTypeLabel = (type: string) => {
    switch (type) {
      case 'welcome': return 'Välkommen';
      case 'promotional': return 'Kampanj';
      case 'seasonal': return 'Säsong';
      case 'system': return 'System';
      default: return type;
    }
  };

  const insertVariable = (variable: string) => {
    const textarea = document.getElementById('content') as HTMLTextAreaElement;
    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const newContent = formData.content.substring(0, start) + variable + formData.content.substring(end);
      setFormData({ ...formData, content: newContent });
      textarea.focus();
      textarea.setSelectionRange(start + variable.length, start + variable.length);
    }
  };

  const availableVariables = [
    '{user_name}',
    '{user_email}',
    '{site_name}',
    '{support_email}',
    '{current_date}',
    '{campaign_name}',
    '{discount_value}',
    '{code}'
  ];

  if (loading) {
    return <div className="p-6">Laddar mallar...</div>;
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center">
          <MessageSquare className="w-8 h-8 text-pink-600 mr-3" />
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Meddelandemallar</h2>
            <p className="text-gray-600">Hantera mallar för olika typer av meddelanden</p>
          </div>
        </div>
        <button
          onClick={() => {
            resetForm();
            setShowModal(true);
          }}
          className="bg-pink-600 text-white px-4 py-2 rounded-lg hover:bg-pink-700 transition-colors flex items-center"
        >
          <Plus className="w-4 h-4 mr-2" />
          Skapa ny mall
        </button>
      </div>

      <div className="grid gap-6">
        {templates.map((template) => (
          <div key={template.id} className="bg-white rounded-lg shadow-md p-6">
            <div className="flex justify-between items-start mb-4">
              <div className="flex-1">
                <div className="flex items-center mb-2">
                  <h3 className="text-lg font-semibold text-gray-800 mr-3">{template.name}</h3>
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    template.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
                  }`}>
                    {template.is_active ? 'Aktiv' : 'Inaktiv'}
                  </span>
                  <span className="px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800 ml-2">
                    {getTemplateTypeLabel(template.template_type)}
                  </span>
                </div>
                <p className="text-sm text-gray-600 mb-2">Ämne: {template.subject}</p>
                <div className="bg-gray-50 rounded p-3 mb-3">
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">{template.content}</p>
                </div>
                {template.variables && template.variables.length > 0 && (
                  <div className="text-xs text-gray-500">
                    Variabler: {template.variables.join(', ')}
                  </div>
                )}
              </div>
              <div className="flex space-x-2 ml-4">
                <button
                  onClick={() => handleEdit(template)}
                  className="p-2 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                  title="Redigera"
                >
                  <Edit3 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDuplicate(template)}
                  className="p-2 text-green-600 hover:bg-green-50 rounded transition-colors"
                  title="Duplicera"
                >
                  <Copy className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(template.id)}
                  className="p-2 text-red-600 hover:bg-red-50 rounded transition-colors"
                  title="Ta bort"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}

        {templates.length === 0 && (
          <div className="text-center py-12">
            <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">Inga mallar hittades</p>
            <p className="text-gray-400 mt-2">Skapa din första mall för att komma igång</p>
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold">
                {editingTemplate ? 'Redigera mall' : 'Skapa ny mall'}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Namn *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-pink-500"
                    placeholder="T.ex. Välkomstmeddelande"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Ämne *
                  </label>
                  <input
                    type="text"
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-pink-500"
                    placeholder="T.ex. Välkommen till vår tjänst!"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Malltyp
                  </label>
                  <select
                    value={formData.template_type}
                    onChange={(e) => setFormData({ ...formData, template_type: e.target.value as any })}
                    className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-pink-500"
                  >
                    <option value="welcome">Välkommen</option>
                    <option value="promotional">Kampanj</option>
                    <option value="seasonal">Säsong</option>
                    <option value="system">System</option>
                  </select>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="is_active"
                    checked={formData.is_active}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                    className="mr-2"
                  />
                  <label htmlFor="is_active" className="text-sm font-medium text-gray-700">
                    Aktiv mall
                  </label>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Variabler (kommaseparerade)
                  </label>
                  <input
                    type="text"
                    value={formData.variables}
                    onChange={(e) => setFormData({ ...formData, variables: e.target.value })}
                    className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-pink-500"
                    placeholder="T.ex. {user_name}, {site_name}"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Innehåll *
                </label>
                <div className="mb-2">
                  <p className="text-xs text-gray-600 mb-2">Tillgängliga variabler:</p>
                  <div className="flex flex-wrap gap-1">
                    {availableVariables.map((variable) => (
                      <button
                        key={variable}
                        type="button"
                        onClick={() => insertVariable(variable)}
                        className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
                      >
                        {variable}
                      </button>
                    ))}
                  </div>
                </div>
                <textarea
                  id="content"
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-pink-500"
                  rows={12}
                  placeholder="Skriv ditt meddelande här..."
                />
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                Avbryt
              </button>
              <button
                onClick={handleSave}
                className="bg-pink-600 text-white px-4 py-2 rounded hover:bg-pink-700 transition-colors flex items-center"
              >
                <Save className="w-4 h-4 mr-2" />
                Spara mall
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}