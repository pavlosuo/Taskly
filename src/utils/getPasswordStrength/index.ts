export function getPasswordStrength(password: string): {
  label: string;
  color: string;
  tips: string[];
} | null {
  if (!password) return null;

  const hasMinLength = password.length >= 8;
  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecial = /[^A-Za-z0-9]/.test(password);
  const hasNoSpaces = !/\s/.test(password);

  const missing: string[] = [];

  if (!hasMinLength) missing.push("Use at least 8 characters");
  if (!hasUpper) missing.push("Add an uppercase letter (A-Z)");
  if (!hasLower) missing.push("Add a lowercase letter (a-z)");
  if (!hasNumber) missing.push("Add at least one number (0-9)");
  if (!hasSpecial) missing.push("Add a special character (!@#$% etc.)");
  if (!hasNoSpaces) missing.push("Remove spaces");

  const checks = [
    hasMinLength,
    hasUpper,
    hasLower,
    hasNumber,
    hasSpecial,
    hasNoSpaces,
  ];

  const score = checks.filter(Boolean).length;

  if (!hasMinLength || !hasNoSpaces) {
    return {
      label: "Invalid password",
      color: "text-red-600",
      tips: missing,
    };
  }

  if (score <= 3) {
    return {
      label: "Weak password",
      color: "text-red",
      tips: missing,
    };
  }

  if (score === 4) {
    return {
      label: "Medium password",
      color: "text-yellow-500",
      tips: missing,
    };
  }

  if (score === 5) {
    return {
      label: "Strong password",
      color: "text-green-500",
      tips: missing,
    };
  }

  return {
    label: "Very strong password",
    color: "text-green-600",
    tips: [],
  };
}
