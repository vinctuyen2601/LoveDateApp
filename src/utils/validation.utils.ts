import { EventFormData, EventFormErrors } from '../types';
import { MIN_TITLE_LENGTH, MAX_TITLE_LENGTH } from '../constants/config';
import { STRINGS } from '../constants/strings';

export class ValidationUtils {
  /**
   * Validate email format
   */
  static isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Validate password strength
   */
  static isValidPassword(password: string): boolean {
    return password.length >= 6;
  }

  /**
   * Validate passwords match
   */
  static doPasswordsMatch(password: string, confirmPassword: string): boolean {
    return password === confirmPassword;
  }

  /**
   * Validate event title
   */
  static isValidTitle(title: string): { valid: boolean; error?: string } {
    if (!title || title.trim().length === 0) {
      return { valid: false, error: STRINGS.error_required_field };
    }
    if (title.trim().length < MIN_TITLE_LENGTH) {
      return { valid: false, error: STRINGS.error_title_too_short };
    }
    if (title.length > MAX_TITLE_LENGTH) {
      return { valid: false, error: STRINGS.error_title_too_long };
    }
    return { valid: true };
  }


  /**
   * Validate event date
   */
  static isValidEventDate(date: Date | null): { valid: boolean; error?: string } {
    if (!date) {
      return { valid: false, error: STRINGS.error_required_field };
    }
    if (isNaN(date.getTime())) {
      return { valid: false, error: STRINGS.error_invalid_date };
    }
    return { valid: true };
  }

  /**
   * Validate event form data
   */
  static validateEventForm(formData: EventFormData): EventFormErrors {
    const errors: EventFormErrors = {};

    // Validate title
    const titleValidation = ValidationUtils.isValidTitle(formData.title);
    if (!titleValidation.valid) {
      errors.title = titleValidation.error;
    }

    // Validate event date
    const dateValidation = ValidationUtils.isValidEventDate(formData.eventDate);
    if (!dateValidation.valid) {
      errors.eventDate = dateValidation.error;
    }

    // Validate category
    if (!formData.category) {
      errors.category = STRINGS.error_required_field;
    }

    // Validate relationship type
    if (!formData.relationshipType) {
      errors.relationshipType = STRINGS.error_required_field;
    }

    return errors;
  }

  /**
   * Check if form has errors
   */
  static hasErrors(errors: EventFormErrors): boolean {
    return Object.keys(errors).length > 0;
  }

  /**
   * Sanitize input string
   */
  static sanitizeInput(input: string): string {
    return input.trim().replace(/\s+/g, ' ');
  }

  /**
   * Validate gift idea
   */
  static isValidGiftIdea(giftIdea: string): boolean {
    return giftIdea.trim().length > 0 && giftIdea.length <= 100;
  }

  /**
   * Validate array of gift ideas
   */
  static validateGiftIdeas(giftIdeas: string[]): string[] {
    return giftIdeas
      .map(idea => ValidationUtils.sanitizeInput(idea))
      .filter(idea => ValidationUtils.isValidGiftIdea(idea));
  }

  /**
   * Validate phone number (Vietnamese format)
   */
  static isValidPhoneNumber(phone: string): boolean {
    const phoneRegex = /^(0|\+84)[0-9]{9}$/;
    return phoneRegex.test(phone.replace(/\s/g, ''));
  }

  /**
   * Validate URL
   */
  static isValidUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Check if string is empty or whitespace
   */
  static isEmpty(value: string | null | undefined): boolean {
    return !value || value.trim().length === 0;
  }

  /**
   * Validate reminder days
   */
  static isValidReminderDays(days: number[]): boolean {
    if (!Array.isArray(days) || days.length === 0) {
      return false;
    }
    return days.every(day => day >= 0 && day <= 365);
  }

  /**
   * Validate display name
   */
  static isValidDisplayName(name: string): { valid: boolean; error?: string } {
    if (!name || name.trim().length === 0) {
      return { valid: false, error: STRINGS.error_required_field };
    }
    if (name.trim().length < 2) {
      return { valid: false, error: 'Tên hiển thị phải có ít nhất 2 ký tự' };
    }
    if (name.length > 50) {
      return { valid: false, error: 'Tên hiển thị không được vượt quá 50 ký tự' };
    }
    return { valid: true };
  }

  /**
   * Validate file size (for image uploads)
   */
  static isValidFileSize(sizeInBytes: number, maxSizeInMB: number = 5): boolean {
    const maxSizeInBytes = maxSizeInMB * 1024 * 1024;
    return sizeInBytes <= maxSizeInBytes;
  }

  /**
   * Validate image file type
   */
  static isValidImageType(filename: string): boolean {
    const validExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
    const extension = filename.toLowerCase().substring(filename.lastIndexOf('.'));
    return validExtensions.includes(extension);
  }
}
