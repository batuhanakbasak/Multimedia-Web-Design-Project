import { z } from 'zod';

const requiredText = (label: string, min = 1) =>
  z
    .string()
    .trim()
    .min(min, `${label} is required.`);

const optionalUrl = z
  .string()
  .trim()
  .url('Please enter a valid URL.')
  .or(z.literal(''))
  .optional();

export const studentLoginSchema = z.object({
  email: z.string().trim().min(1, 'Email is required.').email('Please enter a valid email address.'),
  password: z.string().min(1, 'Password is required.'),
});

export const organizerLoginSchema = studentLoginSchema;

export const registerStudentSchema = z
  .object({
    full_name: requiredText('Full name', 2),
    email: z.string().trim().min(1, 'Email is required.').email('Please enter a valid email address.'),
    password: z.string().min(8, 'Password must be at least 8 characters.'),
    confirm_password: z.string().min(1, 'Please confirm your password.'),
  })
  .refine((data) => data.password === data.confirm_password, {
    path: ['confirm_password'],
    message: 'Passwords do not match.',
  });

export const profileSchema = z.object({
  full_name: requiredText('Full name', 2),
  profile_image: optionalUrl,
});

export const changePasswordSchema = z
  .object({
    current_password: z.string().min(1, 'Current password is required.'),
    new_password: z.string().min(8, 'New password must be at least 8 characters.'),
    confirm_new_password: z.string().min(1, 'Please confirm your new password.'),
  })
  .refine((data) => data.new_password === data.confirm_new_password, {
    path: ['confirm_new_password'],
    message: 'New passwords do not match.',
  });

export const organizerEventSchema = z.object({
  club_id: z
    .string()
    .trim()
    .optional()
    .refine((value) => !value || /^\d+$/.test(value), 'Club ID must be numeric.'),
  title: requiredText('Event title', 3),
  description: requiredText('Description', 10),
  category: requiredText('Category'),
  event_date: z.string().min(1, 'Event date is required.'),
  location: requiredText('Location', 2),
  image_url: optionalUrl,
  quota: z
    .string()
    .min(1, 'Quota is required.')
    .refine((value) => /^\d+$/.test(value) && Number(value) > 0, 'Quota must be a positive number.'),
  status: z.string().optional(),
  map_link: optionalUrl,
});

export const saveClubMemberSchema = z.object({
  user_id: z
    .string()
    .min(1, 'User ID is required.')
    .refine((value) => /^\d+$/.test(value), 'User ID must be numeric.'),
  member_role: z.enum(['member', 'manager'], {
    message: 'Please select a valid club role.',
  }),
});

export type StudentLoginFormValues = z.infer<typeof studentLoginSchema>;
export type OrganizerLoginFormValues = z.infer<typeof organizerLoginSchema>;
export type RegisterStudentFormValues = z.infer<typeof registerStudentSchema>;
export type ProfileFormValues = z.infer<typeof profileSchema>;
export type ChangePasswordFormValues = z.infer<typeof changePasswordSchema>;
export type OrganizerEventFormValues = z.infer<typeof organizerEventSchema>;
export type SaveClubMemberFormValues = z.infer<typeof saveClubMemberSchema>;
