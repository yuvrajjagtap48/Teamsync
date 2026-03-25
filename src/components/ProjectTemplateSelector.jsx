import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { FileText, Clock, Users, Zap } from "lucide-react";
const categoryColors = {
  development: "bg-blue-100 text-blue-800",
  marketing: "bg-green-100 text-green-800",
  product: "bg-purple-100 text-purple-800",
  events: "bg-orange-100 text-orange-800",
  general: "bg-gray-100 text-gray-800",
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
        .from("project_templates")
        .select("*")
        .order("name");
      if (error) throw error;
      setTemplates(data || []);
    } catch (error) {
      toast.error("Failed to load templates");
      console.error("Error fetching templates:", error);
    } finally {
      setLoading(false);
    }
  };
  const fetchTemplateTasks = async (templateId) => {
    try {
      const { data, error } = await supabase
        .from("template_tasks")
        .select("*")
        .eq("template_id", templateId)
        .order("order_index");
      if (error) throw error;
      setTemplateTasks(data || []);
    } catch (error) {
      console.error("Error fetching template tasks:", error);
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
    if (!data) return {};
    try {
      return typeof data === "string" ? JSON.parse(data) : data;
    } catch {
      return {};
    }
  };
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild={true}>{children}</DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle>Choose Project Template</DialogTitle>
          <DialogDescription>
            Select a template to quickly create a new project with predefined
            tasks and structure.
          </DialogDescription>
        </DialogHeader>
        <div className="flex gap-6 h-[60vh]">
          <div className="w-1/2">
            <ScrollArea className="h-full pr-4">
              <div className="space-y-3">
                {loading ? (
                  <div className="text-center py-8 text-muted-foreground">
                    Loading templates...
                  </div>
                ) : templates.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No templates available
                  </div>
                ) : (
                  templates.map((template) => {
                    const CategoryIcon =
                      categoryIcons[template.category] || FileText;
                    const templateData = formatTemplateData(
                      template.template_data,
                    );
                    return (
                      <Card
                        className={`cursor-pointer transition-all ${selectedTemplate?.id === template.id ? "ring-2 ring-primary bg-primary/5" : "hover:shadow-md"}`}
                        onClick={() => handleTemplateSelect(template)}
                        key={template.id}
                      >
                        <CardHeader className="pb-3">
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-2">
                              <CategoryIcon className="h-5 w-5 text-muted-foreground" />
                              <CardTitle className="text-lg">
                                {template.name}
                              </CardTitle>
                            </div>
                            <Badge
                              className={categoryColors[template.category]}
                            >
                              {template.category}
                            </Badge>
                          </div>
                          <CardDescription className="text-sm">
                            {template.description}
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="pt-0">
                          {templateData.phases && (
                            <div className="space-y-2">
                              <p className="text-xs font-medium text-muted-foreground">
                                Phases:
                              </p>
                              <div className="flex flex-wrap gap-1">
                                {templateData.phases.map((phase, index) => (
                                  <Badge
                                    variant="outline"
                                    className="text-xs"
                                    key={index}
                                  >
                                    {phase}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    );
                  })
                )}
              </div>
            </ScrollArea>
          </div>
          <div className="w-1/2">
            <ScrollArea className="h-full pr-4">
              {selectedTemplate ? (
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-semibold mb-2">
                      {selectedTemplate.name}
                    </h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      {selectedTemplate.description}
                    </p>
                    <div className="flex items-center gap-2">
                      <Badge
                        className={categoryColors[selectedTemplate.category]}
                      >
                        {selectedTemplate.category}
                      </Badge>
                      <Badge variant="outline">
                        {templateTasks.length} tasks
                      </Badge>
                    </div>
                  </div>
                  <Separator />
                  <div>
                    <h4 className="font-medium mb-3">Predefined Tasks</h4>
                    <div className="space-y-2">
                      {templateTasks.map((task, index) => (
                        <Card key={task.id}>
                          <CardContent className="p-3">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-sm font-medium">
                                  {task.title}
                                </p>
                                {task.description && (
                                  <p className="text-xs text-muted-foreground mt-1">
                                    {task.description}
                                  </p>
                                )}
                              </div>
                              <div className="flex items-center gap-2">
                                <Badge
                                  className={`text-xs ${task.priority === "high" ? "bg-red-100 text-red-800" : task.priority === "medium" ? "bg-yellow-100 text-yellow-800" : "bg-gray-100 text-gray-800"}`}
                                >
                                  {task.priority}
                                </Badge>
                                {task.estimated_hours && (
                                  <Badge variant="outline" className="text-xs">
                                    {task.estimated_hours}h
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  Select a template to preview its details
                </div>
              )}
            </ScrollArea>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleUseTemplate} disabled={!selectedTemplate}>
            Use Template
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
