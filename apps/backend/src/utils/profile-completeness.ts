import { IUser } from '../models/User.model';

/**
 * Required fields for complete operator profile
 */
const REQUIRED_OPERATOR_FIELDS = [
  'firstName',
  'lastName',
  'email',
  'phone',
  'dateOfBirth',
  'gender',
  'address',
  'state',
  'lga',
  'profilePhoto',
  'accountName',
  'accountNumber',
  'bankName',
];

/**
 * Required guarantor fields (8 fields per guarantor, 2 guarantors = 16 fields)
 */
const REQUIRED_GUARANTOR_FIELDS = [
  'name',
  'phone',
  'address',
  'photo',
  'idType',
  'idNumber',
  'occupation',
  'relationship',
];

/**
 * Check if operator profile is complete
 * @param user User document or user data
 * @param operator Operator document (optional, for checking guarantor fields)
 * @returns Object with isComplete flag and list of missing fields
 */
export function checkProfileCompleteness(user: any, operator?: any): { isComplete: boolean; missingFields: string[] } {
  const missingFields: string[] = [];

  // Check user fields
  for (const field of REQUIRED_OPERATOR_FIELDS) {
    const value = user[field];
    if (!value || value === '' || value === null || value === undefined) {
      missingFields.push(field);
    }
  }

  // Check guarantor fields if operator provided
  if (operator) {
    const guarantors = operator.guarantors || [];
    
    // Check Guarantor 1
    if (guarantors.length >= 1) {
      const guarantor1 = guarantors[0];
      for (const field of REQUIRED_GUARANTOR_FIELDS) {
        const value = guarantor1[field];
        if (!value || value === '' || value === null || value === undefined) {
          missingFields.push(`guarantor1_${field}`);
        }
      }
    } else {
      // No guarantor 1 at all - all fields missing
      for (const field of REQUIRED_GUARANTOR_FIELDS) {
        missingFields.push(`guarantor1_${field}`);
      }
    }

    // Check Guarantor 2
    if (guarantors.length >= 2) {
      const guarantor2 = guarantors[1];
      for (const field of REQUIRED_GUARANTOR_FIELDS) {
        const value = guarantor2[field];
        if (!value || value === '' || value === null || value === undefined) {
          missingFields.push(`guarantor2_${field}`);
        }
      }
    } else {
      // No guarantor 2 at all - all fields missing
      for (const field of REQUIRED_GUARANTOR_FIELDS) {
        missingFields.push(`guarantor2_${field}`);
      }
    }
  }

  return {
    isComplete: missingFields.length === 0,
    missingFields,
  };
}

/**
 * Get human-readable field names for missing fields
 */
export function getMissingFieldLabels(missingFields: string[]): string[] {
  const fieldLabels: Record<string, string> = {
    firstName: 'First Name',
    lastName: 'Last Name',
    email: 'Email Address',
    phone: 'Phone Number',
    dateOfBirth: 'Date of Birth',
    gender: 'Gender',
    address: 'Address',
    state: 'State',
    lga: 'LGA',
    profilePhoto: 'Profile Photo',
    accountName: 'Bank Account Name',
    accountNumber: 'Bank Account Number',
    bankName: 'Bank Name',
    
    // Guarantor 1 fields
    guarantor1_name: 'Guarantor 1 - Name',
    guarantor1_phone: 'Guarantor 1 - Phone',
    guarantor1_address: 'Guarantor 1 - Address',
    guarantor1_photo: 'Guarantor 1 - Photo',
    guarantor1_idType: 'Guarantor 1 - ID Type',
    guarantor1_idNumber: 'Guarantor 1 - ID Number',
    guarantor1_occupation: 'Guarantor 1 - Occupation',
    guarantor1_relationship: 'Guarantor 1 - Relationship',
    
    // Guarantor 2 fields
    guarantor2_name: 'Guarantor 2 - Name',
    guarantor2_phone: 'Guarantor 2 - Phone',
    guarantor2_address: 'Guarantor 2 - Address',
    guarantor2_photo: 'Guarantor 2 - Photo',
    guarantor2_idType: 'Guarantor 2 - ID Type',
    guarantor2_idNumber: 'Guarantor 2 - ID Number',
    guarantor2_occupation: 'Guarantor 2 - Occupation',
    guarantor2_relationship: 'Guarantor 2 - Relationship',
  };

  return missingFields.map(field => fieldLabels[field] || field);
}

/**
 * Update user profile completeness status
 */
export async function updateProfileCompleteness(userId: string, User: any): Promise<void> {
  const user = await User.findById(userId);
  if (!user) return;

  const { isComplete, missingFields } = checkProfileCompleteness(user);
  
  user.isProfileComplete = isComplete;
  user.missingFields = missingFields;
  
  await user.save();
}
