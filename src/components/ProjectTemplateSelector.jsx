import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { FileText, Clock, Users, Zap } from 'lucide-react';
const categoryColors = {
    development: 'bg-blue-100 text-blue-800',
    marketing: 'bg-green-100 text-green-800',
    product: 'bg-purple-100 text-purple-800',
    events: 'bg-orange-100 text-orange-800',
    general: 'bg-gray-100 text-gray-800',
};
const categoryIcons = {
    development: Zap,
    marketing: Users,
    product: FileText,
    events: Clock,
    general: FileText,
};
export function ProjectTemplateSelector({ onTemplateSelect, children }) {
    const [open, setOpen] = useState(false);
    const [templates, setTemplates] = useState([]);
    const [templateTasks, setTemplateTasks] = useState([]);
    const [selectedTemplate, setSelectedTemplate] = useState(null);
    const [loading, setLoading] = useState(false);
    useEffect(() => {
        if (open) {
            fetchTemplates();
        }
    }, [open]);
    const fetchTemplates = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('project_templates')
                .select('*')
                .order('name');
            if (error)
                throw error;
            setTemplates(data || []);
        }
        catch (error) {
            toast.error('Failed to load templates');
            console.error('Error fetching templates:', error);
        }
        finally {
            setLoading(false);
        }
    };
    const fetchTemplateTasks = async (templateId) => {
        try {
            const { data, error } = await supabase
                .from('template_tasks')
                .select('*')
                .eq('template_id', templateId)
                .order('order_index');
            if (error)
                throw error;
            setTemplateTasks(data || []);
        }
        catch (error) {
            console.error('Error fetching template tasks:', error);
        }
    };
    const handleTemplateSelect = (template) => {
        setSelectedTemplate(template);
        fetchTemplateTasks(template.id);
    };
    const handleUseTemplate = () => {
        if (selectedTemplate) {
            onTemplateSelect({
                ...selectedTemplate,
                tasks: templateTasks,
            });
            setOpen(false);
            setSelectedTemplate(null);
            setTemplateTasks([]);
        }
    };
    const formatTemplateData = (data) => {
        if (!data)
            return {};
        try {
            return typeof data === 'string' ? JSON.parse(data) : data;
        }
        catch {
            return {};
        }
    };
    return (_jsxs(Dialog, { open: open, onOpenChange: setOpen, children: [_jsx(DialogTrigger, { asChild: true, children: children }), _jsxs(DialogContent, { className: "max-w-4xl max-h-[90vh] overflow-hidden", children: [_jsxs(DialogHeader, { children: [_jsx(DialogTitle, { children: "Choose Project Template" }), _jsx(DialogDescription, { children: "Select a template to quickly create a new project with predefined tasks and structure." })] }), _jsxs("div", { className: "flex gap-6 h-[60vh]", children: [_jsx("div", { className: "w-1/2", children: _jsx(ScrollArea, { className: "h-full pr-4", children: _jsx("div", { className: "space-y-3", children: loading ? (_jsx("div", { className: "text-center py-8 text-muted-foreground", children: "Loading templates..." })) : templates.length === 0 ? (_jsx("div", { className: "text-center py-8 text-muted-foreground", children: "No templates available" })) : (templates.map((template) => {
                                            const CategoryIcon = categoryIcons[template.category] || FileText;
                                            const templateData = formatTemplateData(template.template_data);
                                            return (_jsxs(Card, { className: `cursor-pointer transition-all ${selectedTemplate?.id === template.id
                                                    ? 'ring-2 ring-primary bg-primary/5'
                                                    : 'hover:shadow-md'}`, onClick: () => handleTemplateSelect(template), children: [_jsxs(CardHeader, { className: "pb-3", children: [_jsxs("div", { className: "flex items-start justify-between", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx(CategoryIcon, { className: "h-5 w-5 text-muted-foreground" }), _jsx(CardTitle, { className: "text-lg", children: template.name })] }), _jsx(Badge, { className: categoryColors[template.category], children: template.category })] }), _jsx(CardDescription, { className: "text-sm", children: template.description })] }), _jsx(CardContent, { className: "pt-0", children: templateData.phases && (_jsxs("div", { className: "space-y-2", children: [_jsx("p", { className: "text-xs font-medium text-muted-foreground", children: "Phases:" }), _jsx("div", { className: "flex flex-wrap gap-1", children: templateData.phases.map((phase, index) => (_jsx(Badge, { variant: "outline", className: "text-xs", children: phase }, index))) })] })) })] }, template.id));
                                        })) }) }) }), _jsx("div", { className: "w-1/2", children: _jsx(ScrollArea, { className: "h-full pr-4", children: selectedTemplate ? (_jsxs("div", { className: "space-y-4", children: [_jsxs("div", { children: [_jsx("h3", { className: "text-lg font-semibold mb-2", children: selectedTemplate.name }), _jsx("p", { className: "text-sm text-muted-foreground mb-4", children: selectedTemplate.description }), _jsxs("div", { className: "flex items-center gap-2", children: [_jsx(Badge, { className: categoryColors[selectedTemplate.category], children: selectedTemplate.category }), _jsxs(Badge, { variant: "outline", children: [templateTasks.length, " tasks"] })] })] }), _jsx(Separator, {}), _jsxs("div", { children: [_jsx("h4", { className: "font-medium mb-3", children: "Predefined Tasks" }), _jsx("div", { className: "space-y-2", children: templateTasks.map((task, index) => (_jsx(Card, { children: _jsx(CardContent, { className: "p-3", children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("p", { className: "text-sm font-medium", children: task.title }), task.description && (_jsx("p", { className: "text-xs text-muted-foreground mt-1", children: task.description }))] }), _jsxs("div", { className: "flex items-center gap-2", children: [_jsx(Badge, { className: `text-xs ${task.priority === 'high'
                                                                                        ? 'bg-red-100 text-red-800'
                                                                                        : task.priority === 'medium'
                                                                                            ? 'bg-yellow-100 text-yellow-800'
                                                                                            : 'bg-gray-100 text-gray-800'}`, children: task.priority }), task.estimated_hours && (_jsxs(Badge, { variant: "outline", className: "text-xs", children: [task.estimated_hours, "h"] }))] })] }) }) }, task.id))) })] })] })) : (_jsx("div", { className: "text-center py-8 text-muted-foreground", children: "Select a template to preview its details" })) }) })] }), _jsxs(DialogFooter, { children: [_jsx(Button, { variant: "outline", onClick: () => setOpen(false), children: "Cancel" }), _jsx(Button, { onClick: handleUseTemplate, disabled: !selectedTemplate, children: "Use Template" })] })] })] }));
}
