export class Profile {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  role: 'student' | 'faculty' | 'administrator';
  departmentId?: number;
  phoneNumber?: string;
  address?: string;
  bio?: string;
  socialMediaUrl?: string;
  created_at: Date;
  updated_at: Date;
}
