import { supabase } from '@/integrations/supabase/client';
export async function createNotification(userId, title, message, type) {
    const { data, error } = await supabase.rpc('create_notification', {
        _user_id: userId,
        _title: title,
        _message: message,
        _type: type,
    });
    if (error) {
        console.error('Failed to create notification:', error);
        return false;
    }
    return true;
}
export async function notifyTaskAssigned(assigneeId, taskTitle, projectTitle) {
    return createNotification(assigneeId, 'New Task Assigned', `You have been assigned to "${taskTitle}" in project "${projectTitle}"`, 'task_assigned');
}
export async function notifyTaskDue(assigneeId, taskTitle, dueDate) {
    const dueDateFormatted = new Date(dueDate).toLocaleDateString();
    return createNotification(assigneeId, 'Task Due Soon', `Task "${taskTitle}" is due on ${dueDateFormatted}`, 'task_due');
}
export async function notifyProjectUpdate(userId, projectTitle, updateType) {
    return createNotification(userId, 'Project Updated', `Project "${projectTitle}" has been ${updateType}`, 'project_update');
}
export async function notifyTaskStatusChange(assigneeId, taskTitle, newStatus) {
    return createNotification(assigneeId, 'Task Status Updated', `Task "${taskTitle}" status changed to ${newStatus}`, 'task_assigned');
}
