# Allow Same Email for Different Properties - Implementation Guide

## Overview
This guide explains how to allow the same homeowner (identified by email) to own multiple properties by creating separate records with the same email but different property_id.

## Database Changes

### Step 1: Run the SQL Migration

Execute `allow_duplicate_emails.sql` in your Supabase SQL Editor:

1. Go to Supabase Dashboard → SQL Editor
2. Copy the entire contents of `allow_duplicate_emails.sql`
3. Paste and run the SQL

This will:
- Remove the UNIQUE constraint on the `email` field
- Create a unique index on `(email, property_id)` combination
- Allow multiple records with same email but different properties

### Step 2: Database Schema After Migration

```
buyer_home_owner_tbl
├── id (unique)
├── email (can be duplicate)
├── property_id (can be duplicate)
├── UNIQUE INDEX on (email, property_id) <- prevents exact duplicates
└── ... other fields

Valid data examples:
✅ john@example.com, Property A, Unit 101
✅ john@example.com, Property B, Unit 205
✅ mary@example.com, Property A, Unit 102

Invalid data:
❌ john@example.com, Property A, Unit 101 (duplicate of first)
❌ john@example.com, Property A, Unit 102 (same email + property)
```

## Code Changes Completed

### 1. Added Helper Functions

Two new functions have been added to `homeowners/index.js`:

```javascript
// Group homeowners by email to show multiple properties
const groupHomeownersByEmail = (homeownersList) => {
  const grouped = {};

  homeownersList.forEach(homeowner => {
    if (!grouped[homeowner.email]) {
      grouped[homeowner.email] = {
        ...homeowner,
        properties: []
      };
    }

    grouped[homeowner.email].properties.push({
      id: homeowner.id,
      property_id: homeowner.property_id,
      unit_number: homeowner.unit_number,
      // ... other property fields
    });
  });

  return Object.values(grouped);
};

// Get grouped homeowners for display
const getDisplayHomeowners = () => {
  return groupHomeownersByEmail(filteredHomeowners);
};
```

## UI Updates Needed

### Step 3: Update Homeowner Cards Display

Find the section where homeowners are displayed (usually in the map function) and update it to show multiple properties:

```jsx
{/* Replace the existing homeowner map with this */}
{loading ? (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
    {Array(6).fill(0).map((_, i) => (
      <div key={i} className="h-96 bg-slate-200 animate-pulse rounded-2xl" />
    ))}
  </div>
) : getDisplayHomeowners().length === 0 ? (
  <div className="text-center py-16">
    <div className="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-6">
      <User className="w-12 h-12 text-slate-400" />
    </div>
    <h3 className="text-xl font-semibold text-slate-900 mb-2">
      No Homeowners Found
    </h3>
    <p className="text-slate-600">
      Start by adding your first homeowner
    </p>
  </div>
) : (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
    {getDisplayHomeowners().map((homeowner, index) => (
      <motion.div
        key={`${homeowner.email}-${index}`}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.05 }}
      >
        <Card className="group relative overflow-hidden bg-white border border-slate-200/60 hover:shadow-2xl hover:shadow-purple-500/10 hover:border-purple-200 transition-all duration-300 hover:-translate-y-1">
          <CardHeader className="pb-3 relative">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <Avatar className="h-12 w-12 border-2 border-purple-200 ring-2 ring-purple-100">
                  <AvatarFallback className="bg-gradient-to-br from-purple-500 to-pink-500 text-white font-semibold">
                    {getInitials(homeowner.full_name)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <CardTitle className="text-lg font-bold text-slate-900 group-hover:text-purple-900 transition-colors">
                    {homeowner.full_name}
                  </CardTitle>
                  {homeowner.properties.length > 1 && (
                    <Badge className="mt-1 bg-purple-100 text-purple-700 border-purple-200">
                      {homeowner.properties.length} Properties
                    </Badge>
                  )}
                </div>
              </div>
              <Badge className={`${getStatusColor(homeowner.status)} border font-semibold shadow-sm`}>
                {homeowner.status}
              </Badge>
            </div>
          </CardHeader>

          <CardContent className="space-y-4">
            {/* Contact Information */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-slate-700 text-sm">
                <Mail className="w-4 h-4 text-purple-600 flex-shrink-0" />
                <span className="truncate">{homeowner.email}</span>
              </div>
              {homeowner.phone && (
                <div className="flex items-center gap-2 text-slate-700 text-sm">
                  <Phone className="w-4 h-4 text-green-600 flex-shrink-0" />
                  <span>{homeowner.phone}</span>
                </div>
              )}
            </div>

            {/* Properties Section - NEW */}
            <div className="bg-gradient-to-br from-slate-50 to-slate-100/50 rounded-xl p-4 space-y-3 border border-slate-200/60">
              <h4 className="font-semibold text-slate-900 flex items-center gap-2 text-sm">
                <Home className="w-4 h-4 text-purple-600" />
                Properties ({homeowner.properties.length})
              </h4>

              <div className="space-y-2 max-h-40 overflow-y-auto">
                {homeowner.properties.map((prop, idx) => (
                  <div
                    key={prop.id}
                    className="bg-white p-3 rounded-lg border border-slate-200 hover:border-purple-200 transition-colors"
                  >
                    <div className="flex justify-between items-start mb-1">
                      <div className="flex-1">
                        <p className="font-medium text-slate-900 text-sm">
                          Unit {prop.unit_number}
                        </p>
                        <div className="flex items-center gap-2 text-xs text-slate-600 mt-1">
                          <DollarSign className="w-3 h-3" />
                          <span>₱{parseFloat(prop.monthly_dues || 0).toLocaleString()}/mo</span>
                        </div>
                      </div>
                      <Badge className={`${getStatusColor(prop.status)} text-xs`}>
                        {prop.status}
                      </Badge>
                    </div>

                    {prop.remaining_balance > 0 && (
                      <div className="mt-2 pt-2 border-t border-slate-100">
                        <p className="text-xs text-slate-500">
                          Balance: ₱{parseFloat(prop.remaining_balance).toLocaleString()}
                        </p>
                      </div>
                    )}

                    {/* Edit/Delete buttons for individual property */}
                    <div className="flex gap-1 mt-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="flex-1 h-7 text-xs"
                        onClick={() => handleEditHomeowner(homeowner.properties[idx])}
                      >
                        <Edit className="w-3 h-3 mr-1" />
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="flex-1 h-7 text-xs text-red-600"
                        onClick={() => handleDeleteHomeowner(homeowner.properties[idx])}
                      >
                        <Trash2 className="w-3 h-3 mr-1" />
                        Delete
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Emergency Contact */}
            {homeowner.emergency_contact_name && (
              <div className="text-xs text-slate-500 pt-3 border-t border-slate-200">
                <p className="font-medium text-slate-700">Emergency Contact:</p>
                <p>{homeowner.emergency_contact_name}</p>
                {homeowner.emergency_contact_phone && (
                  <p>{homeowner.emergency_contact_phone}</p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    ))}
  </div>
)}
```

### Step 4: Update Form Validation (Optional)

If you want to check for duplicate email+property combinations before submit, add this validation:

```javascript
const checkDuplicateEmailProperty = async (email, propertyId, excludeId = null) => {
  try {
    let query = supabase
      .from("buyer_home_owner_tbl")
      .select("id")
      .eq("email", email.toLowerCase())
      .eq("property_id", propertyId);

    if (excludeId) {
      query = query.neq("id", excludeId);
    }

    const { data, error } = await query;

    if (error) throw error;

    return data && data.length > 0;
  } catch (error) {
    console.error("Error checking duplicate:", error);
    return false;
  }
};

// In handleSubmit, before insert/update:
const isDuplicate = await checkDuplicateEmailProperty(
  formData.email,
  formData.property_id,
  editingHomeowner?.id
);

if (isDuplicate) {
  toast.error("This email is already assigned to this property!");
  return;
}
```

### Step 5: Add Info Message in Create Form

Add an informational message in your create/edit form to explain the feature:

```jsx
{/* Add this in Step 1 (Personal Information) of your form */}
<div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-4">
  <div className="flex gap-3">
    <AlertTriangle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
    <div>
      <h4 className="font-semibold text-blue-900 text-sm">Multiple Properties Support</h4>
      <p className="text-blue-700 text-xs mt-1">
        You can create multiple records with the same email for different properties.
        Each homeowner can own multiple units.
      </p>
    </div>
  </div>
</div>
```

## Usage Examples

### Creating Multiple Properties for Same Homeowner

1. Create first property:
   ```
   Email: john@example.com
   Property: Building A
   Unit: 101
   ```

2. Create second property (same email):
   ```
   Email: john@example.com
   Property: Building B
   Unit: 205
   ```

3. Result: Two separate records, grouped by email in the UI

### Display Result

The UI will show:
```
┌─────────────────────────────────────┐
│ John Doe                   [Active] │
│ john@example.com      [2 Properties]│
│                                     │
│ Properties (2)                      │
│ ┌─────────────────────────────────┐ │
│ │ Unit 101            [Active]    │ │
│ │ ₱5,000/mo                       │ │
│ │ [Edit] [Delete]                 │ │
│ └─────────────────────────────────┘ │
│ ┌─────────────────────────────────┐ │
│ │ Unit 205            [Active]    │ │
│ │ ₱6,000/mo                       │ │
│ │ [Edit] [Delete]                 │ │
│ └─────────────────────────────────┘ │
└─────────────────────────────────────┘
```

## Important Notes

1. **Authentication**: If you're using email for login, ensure your authentication system can handle this. You may need to use user_id instead.

2. **Data Integrity**: Each property ownership is a separate record, so:
   - Financial data is tracked per property
   - Status is tracked per property
   - Move-in dates are tracked per property

3. **Deleting**: When deleting, you delete only one property assignment, not all properties for that email.

4. **Editing**: When editing, you edit only one property record. If you want to update personal info (name, phone), you'll need to update all records with that email.

## Rollback Plan

To revert changes:

```sql
-- Remove the composite unique index
DROP INDEX IF EXISTS idx_unique_email_property;

-- Restore unique constraint on email (will fail if duplicates exist)
ALTER TABLE buyer_home_owner_tbl
ADD CONSTRAINT buyer_home_owner_tbl_email_key UNIQUE (email);
```

Note: You'll need to clean up duplicate emails before running the rollback.

## Testing Checklist

- [ ] Run SQL migration successfully
- [ ] Create homeowner with unique email
- [ ] Create second homeowner with same email but different property
- [ ] Verify both records are created
- [ ] Verify UI groups them correctly
- [ ] Test editing individual properties
- [ ] Test deleting individual properties
- [ ] Test that duplicate email+property is prevented
- [ ] Test search/filter functionality
- [ ] Verify financial calculations per property

## Benefits

✅ One person can own multiple properties
✅ Each property has separate financial tracking
✅ Better reflects real-world scenarios
✅ No need for complex junction tables
✅ Simple to implement and maintain
