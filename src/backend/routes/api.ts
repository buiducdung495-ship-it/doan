import { Router } from 'express';
import { 
  UserController, 
  FormController, 
  RequestController, 
  AssetController, 
  ChatController, 
  NotificationController, 
  PaymentController,
  IncomingDocumentController,
  OutgoingDocumentController,
  EventController,
  TaskController,
  InternalDocumentController,
  AuditLogController,
  SharedCategoryController,
  OCRDocumentController,
  CloudFileController
} from '../controllers/MVCControllers';
import { AIController } from '../controllers/AIController';

const router = Router();


// User Routes
router.get('/users', UserController.getUsers);
router.get('/users/:id', UserController.getUserById);
router.put('/users/:id', UserController.updateUser);
router.delete('/users/:id', UserController.deleteUser);
router.post('/auth/login', UserController.login);
router.post('/auth/register', UserController.register);

// Dynamic Form Template Routes
router.post('/forms/ai-generate', FormController.generateFormFields);
router.get('/forms', FormController.getForms);
router.get('/forms/:id', FormController.getFormById);
router.post('/forms', FormController.createForm);
router.put('/forms/:id', FormController.updateForm);
router.delete('/forms/:id', FormController.deleteForm);

// Workflow Submission & Approval Routes
router.get('/requests', RequestController.getRequests);
router.get('/requests/:id', RequestController.getRequestById);
router.post('/requests', RequestController.createRequest);
router.post('/requests/:id/approve', RequestController.approveRequest);
router.post('/requests/:id/reject', RequestController.rejectRequest);
router.post('/requests/analyze', RequestController.analyzeComplexity);

// Asset Management Routes
router.get('/assets', AssetController.getAssets);
router.get('/assets/:id', AssetController.getAssetById);
router.post('/assets/request', AssetController.requestAsset);
router.post('/assets/return', AssetController.requestReturn);
router.post('/assets/exchange', AssetController.requestExchange);
router.post('/assets/buyback', AssetController.requestBuyback);
router.post('/assets/:id/approve', AssetController.approveAssetRequest);
router.post('/assets/:id/reject', AssetController.rejectAssetRequest);

// Chat & Live Channels Routes
router.get('/chats', ChatController.getChats);
router.post('/chats', ChatController.sendChat);
router.delete('/chats/:id', ChatController.deleteChat);
router.post('/chats/ai', ChatController.chatWithAI);
router.get('/chats/groups', ChatController.getGroups);
router.post('/chats/groups', ChatController.createGroup);
router.put('/chats/groups/:id', ChatController.updateGroup);

// Personal Cloud Storage Routes
router.get('/cloud-files', CloudFileController.getFiles);
router.post('/cloud-files', CloudFileController.uploadFile);
router.delete('/cloud-files/:id', CloudFileController.deleteFile);

// Push Notifications Routes
router.get('/notifications', NotificationController.getNotifications);
router.post('/notifications', NotificationController.createNotification);
router.post('/notifications/read-all', NotificationController.markAllAsRead);
router.put('/notifications/:id/read', NotificationController.markAsRead);

// Financial / Payments Routes
router.get('/payments', PaymentController.getPayments);

// Incoming Documents Routes
router.get('/documents/incoming', IncomingDocumentController.getDocuments);
router.get('/documents/incoming/:id', IncomingDocumentController.getDocumentById);
router.post('/documents/incoming', IncomingDocumentController.createDocument);
router.put('/documents/incoming/:id', IncomingDocumentController.updateDocument);
router.delete('/documents/incoming/:id', IncomingDocumentController.deleteDocument);

// Outgoing Documents Routes
router.get('/documents/outgoing', OutgoingDocumentController.getDocuments);
router.get('/documents/outgoing/:id', OutgoingDocumentController.getDocumentById);
router.post('/documents/outgoing', OutgoingDocumentController.createDocument);
router.put('/documents/outgoing/:id', OutgoingDocumentController.updateDocument);
router.delete('/documents/outgoing/:id', OutgoingDocumentController.deleteDocument);

// Events Routes
router.get('/events', EventController.getEvents);
router.get('/events/:id', EventController.getEventById);
router.post('/events', EventController.createEvent);
router.put('/events/:id', EventController.updateEvent);
router.delete('/events/:id', EventController.deleteEvent);

// Tasks Routes
router.get('/tasks', TaskController.getTasks);
router.get('/tasks/:id', TaskController.getTaskById);
router.post('/tasks', TaskController.createTask);
router.put('/tasks/:id', TaskController.updateTask);
router.delete('/tasks/:id', TaskController.deleteTask);

// Internal Documents Routes
router.get('/documents/internal', InternalDocumentController.getDocuments);
router.get('/documents/internal/:id', InternalDocumentController.getDocumentById);
router.post('/documents/internal', InternalDocumentController.createDocument);
router.put('/documents/internal/:id', InternalDocumentController.updateDocument);
router.delete('/documents/internal/:id', InternalDocumentController.deleteDocument);

// Audit Logs Routes
router.get('/audit-logs', AuditLogController.getLogs);
router.post('/audit-logs', AuditLogController.createLog);

// Shared Categories Routes
router.get('/shared-categories', SharedCategoryController.getCategories);
router.get('/shared-categories/:id', SharedCategoryController.getCategoryById);
router.post('/shared-categories', SharedCategoryController.createCategory);
router.put('/shared-categories/:id', SharedCategoryController.updateCategory);
router.delete('/shared-categories/:id', SharedCategoryController.deleteCategory);

// OCR Document Routes
router.get('/ocr-documents', OCRDocumentController.getDocuments);
router.get('/ocr-documents/:id', OCRDocumentController.getDocumentById);
router.post('/ocr-documents', OCRDocumentController.createDocument);
router.put('/ocr-documents/:id', OCRDocumentController.updateDocument);
router.delete('/ocr-documents/:id', OCRDocumentController.deleteDocument);

// AI Routes
router.post('/ai/summarize', AIController.summarizeDocument);
router.post('/ai/extract-ocr', AIController.extractOCR);
router.post('/ai/analyze-image', AIController.analyzeImage);

export default router;
