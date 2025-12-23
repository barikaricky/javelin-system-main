# 📋 Company Document Management System

## ✅ Features Implemented

### Backend (100% Complete)

1. **CompanyDocument Model** ([CompanyDocument.model.ts](apps/backend/src/models/CompanyDocument.model.ts))
   - Document types: LICENSE, PERMIT, CERTIFICATE, INSURANCE, CONTRACT, OTHER
   - Tracks registration date and expiry date
   - Automatic expiry status checking
   - File upload support (PDF, DOC, DOCX, JPG, PNG)
   - Virtual field for days until expiry
   - Auto-marks documents as "expiring soon" when < 30 days

2. **Document Service** ([companyDocument.service.ts](apps/backend/src/services/companyDocument.service.ts))
   - Create, read, update, delete documents
   - Get expiring soon documents
   - Get expired documents
   - Document statistics by type
   - **Automatic notification system** - sends alerts to Director, Manager, and Secretary

3. **API Routes** ([companyDocument.routes.ts](apps/backend/src/routes/companyDocument.routes.ts))
   - `POST /api/documents` - Upload new document (with file)
   - `GET /api/documents` - List all documents with filters
   - `GET /api/documents/stats` - Get statistics
   - `GET /api/documents/expiring-soon` - Get documents expiring soon
   - `GET /api/documents/expired` - Get expired documents
   - `GET /api/documents/:id` - Get document by ID
   - `PUT /api/documents/:id` - Update document
   - `DELETE /api/documents/:id` - Delete document (Director only)
   - `POST /api/documents/check-expiring` - Manual expiry check

4. **Automated Notifications** ([cronJobs.ts](apps/backend/src/utils/cronJobs.ts))
   - **Runs daily at 8:00 AM** to check for expiring documents
   - Sends notifications to Director, Manager, and Secretary
   - Notifications appear 30 days before expiry
   - High priority for documents expiring in 7 days
   - Automatic notification tracking to avoid duplicates

### Frontend (100% Complete)

1. **Documents List Page** ([DocumentsListPage.tsx](apps/frontend/src/pages/secretary/documents/DocumentsListPage.tsx))
   - **Dashboard with 4 stat cards**: Total, Active, Expiring Soon, Expired
   - **Visual status badges**:
     - 🔴 Red: Expired documents
     - 🟡 Yellow: Expiring soon (< 30 days)
     - 🟢 Green: Active documents
   - **Filters**: Search, document type, status
   - **Table view** with download and view actions
   - Animated pulse on "Expiring Soon" stat card

2. **Upload Document Page** ([UploadDocumentPage.tsx](apps/frontend/src/pages/secretary/documents/UploadDocumentPage.tsx))
   - **Drag and drop file upload** (up to 10MB)
   - Document name and type selection
   - Document number and issuer fields
   - **Registration and expiry dates** (validated)
   - Description field for notes
   - File validation (PDF, DOC, DOCX, JPG, PNG only)

3. **Secretary Sidebar Integration**
   - New "Documents" menu with 3 sub-items:
     - All Documents
     - Upload Document
     - Expiring Soon (with badge count)

### Access Control

- **Secretary**: Upload, view, edit documents
- **Manager**: View, edit documents
- **Director**: Full access including delete
- **All three roles**: Receive automatic expiry notifications

## 🔔 Notification System

### How It Works:

1. **Automatic Daily Check** (8:00 AM)
   - Cron job runs every morning
   - Checks all documents expiring within 30 days
   - Sends notifications to Director, Manager, Secretary

2. **Notification Priority**:
   - **HIGH**: 7 days or less until expiry (urgent)
   - **MEDIUM**: 8-30 days until expiry

3. **Notification Content**:
   ```
   Title: Document Expiring Soon: [Document Name]
   Message: The [type] "[name]" will expire in [X] days ([date]). 
            Please renew it as soon as possible.
   ```

4. **Manual Check**:
   - Directors can manually trigger expiry check
   - POST to `/api/documents/check-expiring`

## 📊 Statistics Dashboard

### Real-time Metrics:
- **Total Documents**: All uploaded documents
- **Active Documents**: Not yet expired
- **Expiring Soon**: Less than 30 days (animated)
- **Expired**: Past expiry date
- **By Type**: Breakdown of document types

## 🎯 Usage Examples

### 1. Upload a License
```
1. Navigate to Secretary > Documents > Upload Document
2. Select file (e.g., security_license.pdf)
3. Fill in:
   - Name: "Private Security License"
   - Type: LICENSE
   - Number: PSL-2024-12345
   - Issuer: Ministry of Interior
   - Registration: 2024-01-01
   - Expiry: 2025-12-31
4. Click "Upload Document"
```

### 2. View Expiring Documents
```
1. Navigate to Secretary > Documents
2. Click filter: "Expiring Soon"
3. See all documents with < 30 days
4. Yellow badge shows exact days remaining
```

### 3. Check Notifications
```
- Director/Manager/Secretary will see notification
- 30 days before expiry: First notification
- Content shows exact expiry date and days left
- High priority if < 7 days
```

## 🚀 Installation & Setup

### 1. Install Dependencies
```bash
cd apps/backend
pnpm install
```

### 2. Start MongoDB
```bash
mongod
# or
net start MongoDB
```

### 3. Start Backend
```bash
cd apps/backend
pnpm dev
```

The cron job will automatically start and log:
```
✅ Cron jobs initialized
```

### 4. Start Frontend
```bash
cd apps/frontend
pnpm dev
```

## 📁 File Uploads

- **Storage Location**: `apps/backend/uploads/documents/`
- **Max File Size**: 10MB
- **Allowed Types**: PDF, DOC, DOCX, JPG, JPEG, PNG
- **Naming Convention**: `doc-[timestamp]-[random].ext`

## 🎨 Visual Indicators

### Status Colors:
- 🔴 **Red Border + Badge**: Expired (critical)
- 🟡 **Yellow Border + Badge**: Expiring Soon (warning)
- 🟢 **Green Badge**: Active (normal)
- 🟣 **Purple**: Document type labels

### Animations:
- **Pulse animation** on "Expiring Soon" stat card
- **Hover effects** on document rows
- **Loading spinners** during upload

## 🔒 Security

- **Role-based access control** on all routes
- **File type validation** on upload
- **Size limits** to prevent abuse
- **Only Directors can delete** documents
- **Authentication required** for all endpoints

## 📅 Cron Schedule

```javascript
// Daily at 8:00 AM
cron.schedule('0 8 * * *', checkExpiring);
```

To change the schedule, edit `apps/backend/src/utils/cronJobs.ts`:
- `'0 8 * * *'` = 8:00 AM daily
- `'0 */6 * * *'` = Every 6 hours
- `'0 0 * * 0'` = Every Sunday at midnight

## ✅ All Fixed Issues

1. ✅ Duplicate import in CityAutocomplete.tsx - **FIXED**
2. ✅ Document model created with expiry tracking
3. ✅ Service layer with notification system
4. ✅ API routes with file upload
5. ✅ Frontend pages with drag-and-drop
6. ✅ Cron job for daily checks
7. ✅ Notifications to all 3 roles
8. ✅ 30-day warning system

Your company document tracking system is **100% complete and operational**! 🎉
