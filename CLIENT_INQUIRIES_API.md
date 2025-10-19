# Client Inquiries API Documentation

The `/api/client-inquiries` endpoint provides server-side access to client inquiries with filtering, pagination, and management capabilities.

---

## 🔗 Endpoints

### 1. GET `/api/client-inquiries` - Fetch Inquiries

Retrieves client inquiries with optional filtering and pagination.

#### Query Parameters:

| Parameter | Type | Description | Example |
|-----------|------|-------------|---------|
| `roleId` | UUID | Filter by role ID | `49d60eb8-184b-48b3-9f4f-d002d3008ea7` |
| `status` | String | Filter by status | `pending`, `in_progress`, `responded`, `closed`, `all` |
| `userId` | UUID | Filter by user ID | `abc123...` |
| `clientEmail` | String | Filter by email | `user@example.com` |
| `limit` | Number | Limit results | `10` |
| `offset` | Number | Pagination offset | `0` |

#### Example Requests:

```javascript
// Get all inquiries for a specific role
const response = await fetch(
  '/api/client-inquiries?roleId=49d60eb8-184b-48b3-9f4f-d002d3008ea7'
);
const data = await response.json();

// Get pending inquiries only
const response = await fetch(
  '/api/client-inquiries?roleId=49d60eb8-184b-48b3-9f4f-d002d3008ea7&status=pending'
);

// Get inquiries with pagination
const response = await fetch(
  '/api/client-inquiries?roleId=49d60eb8-184b-48b3-9f4f-d002d3008ea7&limit=10&offset=0'
);

// Get inquiries for a specific user
const response = await fetch(
  '/api/client-inquiries?userId=abc123...'
);

// Get inquiries by email
const response = await fetch(
  '/api/client-inquiries?clientEmail=user@example.com'
);
```

#### Response Format:

```json
{
  "success": true,
  "data": [
    {
      "inquiry_id": "uuid-here",
      "property_id": "uuid-here",
      "property_title": "Beautiful 3BR House",
      "user_id": "uuid-here",
      "role_id": "49d60eb8-184b-48b3-9f4f-d002d3008ea7",
      "client_firstname": "John",
      "client_lastname": "Doe",
      "client_email": "john@example.com",
      "client_phone": "+63 XXX XXX XXXX",
      "message": "I'm interested in this property...",
      "is_authenticated": true,
      "status": "pending",
      "created_at": "2025-01-20T10:30:00Z",
      "updated_at": "2025-01-20T10:30:00Z"
    }
  ],
  "total": 25,
  "message": "Found 10 inquiries"
}
```

---

### 2. DELETE `/api/client-inquiries` - Delete Inquiry

Deletes a specific inquiry by ID.

#### Query Parameters:

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `inquiryId` | UUID | Yes | ID of inquiry to delete |

#### Example Request:

```javascript
const response = await fetch(
  '/api/client-inquiries?inquiryId=uuid-here',
  {
    method: 'DELETE'
  }
);
const data = await response.json();
```

#### Response Format:

```json
{
  "success": true,
  "message": "Inquiry deleted successfully"
}
```

---

### 3. PATCH `/api/client-inquiries` - Update Inquiry Status

Updates the status of an inquiry.

#### Request Body:

```json
{
  "inquiryId": "uuid-here",
  "status": "in_progress"
}
```

#### Valid Status Values:
- `pending`
- `in_progress`
- `responded`
- `closed`

#### Example Request:

```javascript
const response = await fetch('/api/client-inquiries', {
  method: 'PATCH',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    inquiryId: 'uuid-here',
    status: 'in_progress'
  })
});
const data = await response.json();
```

#### Response Format:

```json
{
  "success": true,
  "data": {
    "inquiry_id": "uuid-here",
    "status": "in_progress",
    "updated_at": "2025-01-20T11:00:00Z",
    ...
  },
  "message": "Inquiry status updated successfully"
}
```

---

## 🔒 Security Features

- ✅ Uses Supabase Service Role Key (server-side only)
- ✅ No direct database access from client
- ✅ Server-side validation
- ✅ Error handling and logging

---

## 📊 Usage Examples

### React Component Example:

```jsx
import { useState, useEffect } from 'react';

function InquiriesDashboard() {
  const [inquiries, setInquiries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');

  // Fetch inquiries
  useEffect(() => {
    fetchInquiries();
  }, [statusFilter]);

  const fetchInquiries = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        roleId: '49d60eb8-184b-48b3-9f4f-d002d3008ea7',
        status: statusFilter
      });

      const response = await fetch(`/api/client-inquiries?${params}`);
      const result = await response.json();

      if (result.success) {
        setInquiries(result.data);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  // Update inquiry status
  const updateStatus = async (inquiryId, newStatus) => {
    try {
      const response = await fetch('/api/client-inquiries', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          inquiryId: inquiryId,
          status: newStatus
        })
      });

      const result = await response.json();

      if (result.success) {
        // Refresh inquiries
        fetchInquiries();
        alert('Status updated!');
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  // Delete inquiry
  const deleteInquiry = async (inquiryId) => {
    try {
      const response = await fetch(
        `/api/client-inquiries?inquiryId=${inquiryId}`,
        { method: 'DELETE' }
      );

      const result = await response.json();

      if (result.success) {
        setInquiries(prev =>
          prev.filter(i => i.inquiry_id !== inquiryId)
        );
        alert('Inquiry deleted!');
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  return (
    <div>
      {/* Your UI here */}
    </div>
  );
}
```

---

## 🧪 Testing

### Using curl:

```bash
# Get inquiries
curl "http://localhost:3000/api/client-inquiries?roleId=49d60eb8-184b-48b3-9f4f-d002d3008ea7"

# Delete inquiry
curl -X DELETE "http://localhost:3000/api/client-inquiries?inquiryId=uuid-here"

# Update status
curl -X PATCH "http://localhost:3000/api/client-inquiries" \
  -H "Content-Type: application/json" \
  -d '{"inquiryId":"uuid-here","status":"in_progress"}'
```

---

## 📝 Notes

- All endpoints return JSON responses
- Timestamps are in ISO 8601 format
- All IDs are UUIDs
- Server uses Supabase Service Role Key for admin access
- Frontend now uses API instead of direct Supabase calls

---

## 🚀 Benefits

1. **Better Security**: No database credentials exposed to client
2. **Centralized Logic**: All inquiry operations in one place
3. **Easy Maintenance**: Update API without changing frontend
4. **Better Logging**: Server-side logs for debugging
5. **Scalability**: Can add caching, rate limiting, etc.
