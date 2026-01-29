/**
 * Lord of the Components - Accessibility Validator
 *
 * Validates component definitions for accessibility best practices.
 */

import type { ComponentDefinition, PropDefinition, SlotDefinition } from '../types/components.js';

// =============================================================================
// TYPES
// =============================================================================

export interface AccessibilityIssue {
  severity: 'error' | 'warning' | 'info';
  code: string;
  message: string;
  suggestion?: string;
}

export interface ValidationResult {
  valid: boolean;
  issues: AccessibilityIssue[];
}

// =============================================================================
// RULES
// =============================================================================

interface AccessibilityRule {
  code: string;
  check: (component: ComponentDefinition) => AccessibilityIssue | null;
}

const rules: AccessibilityRule[] = [
  // Interactive elements need labels
  {
    code: 'A11Y001',
    check: (component) => {
      const interactiveCategories = ['actions', 'inputs', 'navigation'];
      if (!interactiveCategories.includes(component.category)) return null;

      const hasLabelProp = component.props.some(p =>
        ['label', 'aria-label', 'ariaLabel', 'title'].includes(p.name)
      );
      const hasLabelSlot = component.slots.some(s =>
        ['label', 'default'].includes(s.name)
      );

      if (!hasLabelProp && !hasLabelSlot) {
        return {
          severity: 'error',
          code: 'A11Y001',
          message: `Interactive component '${component.name}' should have a label prop or slot`,
          suggestion: `Add a 'label' prop or slot to provide accessible text`,
        };
      }
      return null;
    },
  },

  // Form inputs need associated labels
  {
    code: 'A11Y002',
    check: (component) => {
      if (component.category !== 'inputs') return null;

      const hasId = component.props.some(p => p.name === 'id');
      const hasLabel = component.props.some(p => p.name === 'label');

      if (!hasId && !hasLabel) {
        return {
          severity: 'warning',
          code: 'A11Y002',
          message: `Input component '${component.name}' should have 'id' and/or 'label' props`,
          suggestion: `Add an 'id' prop for label association or a 'label' prop for built-in labeling`,
        };
      }
      return null;
    },
  },

  // Buttons should have type attribute
  {
    code: 'A11Y003',
    check: (component) => {
      if (component.name !== 'button') return null;

      const hasType = component.props.some(p => p.name === 'type');

      if (!hasType) {
        return {
          severity: 'warning',
          code: 'A11Y003',
          message: `Button component should have a 'type' prop`,
          suggestion: `Add a 'type' prop with values 'button', 'submit', 'reset'`,
        };
      }
      return null;
    },
  },

  // Images need alt text
  {
    code: 'A11Y004',
    check: (component) => {
      if (!['image', 'img', 'avatar', 'icon'].includes(component.name)) return null;

      const hasAlt = component.props.some(p =>
        ['alt', 'aria-label', 'ariaLabel', 'title'].includes(p.name)
      );

      if (!hasAlt) {
        return {
          severity: 'error',
          code: 'A11Y004',
          message: `Image component '${component.name}' must have an 'alt' prop`,
          suggestion: `Add an 'alt' prop for descriptive text or empty string for decorative images`,
        };
      }
      return null;
    },
  },

  // Links should have href
  {
    code: 'A11Y005',
    check: (component) => {
      if (!['link', 'a', 'anchor'].includes(component.name)) return null;

      const hasHref = component.props.some(p => p.name === 'href');

      if (!hasHref) {
        return {
          severity: 'error',
          code: 'A11Y005',
          message: `Link component '${component.name}' must have an 'href' prop`,
          suggestion: `Add an 'href' prop for the link destination`,
        };
      }
      return null;
    },
  },

  // Disabled state should be communicable
  {
    code: 'A11Y006',
    check: (component) => {
      const hasDisabled = component.props.some(p => p.name === 'disabled');
      if (!hasDisabled) return null;

      // This is informational - suggest aria-disabled consideration
      return {
        severity: 'info',
        code: 'A11Y006',
        message: `Component '${component.name}' has disabled state`,
        suggestion: `Consider using aria-disabled for better screen reader support when disabled but focusable`,
      };
    },
  },

  // Loading states need communication
  {
    code: 'A11Y007',
    check: (component) => {
      const hasLoading = component.props.some(p =>
        ['loading', 'isLoading', 'busy'].includes(p.name)
      );
      if (!hasLoading) return null;

      return {
        severity: 'info',
        code: 'A11Y007',
        message: `Component '${component.name}' has loading state`,
        suggestion: `Ensure loading state is announced via aria-busy or aria-live region`,
      };
    },
  },

  // Modal/dialog components need focus management
  {
    code: 'A11Y008',
    check: (component) => {
      if (!['modal', 'dialog', 'drawer', 'popover'].includes(component.name)) return null;

      return {
        severity: 'info',
        code: 'A11Y008',
        message: `Overlay component '${component.name}' requires focus management`,
        suggestion: `Implement focus trap, return focus on close, and appropriate ARIA roles`,
      };
    },
  },

  // Tables need proper structure
  {
    code: 'A11Y009',
    check: (component) => {
      if (!['table', 'data-table', 'datagrid'].includes(component.name)) return null;

      const hasCaption = component.props.some(p => p.name === 'caption');
      const hasSummary = component.props.some(p => p.name === 'summary');

      if (!hasCaption && !hasSummary) {
        return {
          severity: 'warning',
          code: 'A11Y009',
          message: `Table component '${component.name}' should have a caption or summary`,
          suggestion: `Add a 'caption' prop for visible table description`,
        };
      }
      return null;
    },
  },

  // Color contrast considerations
  {
    code: 'A11Y010',
    check: (component) => {
      const hasVariant = component.props.some(p =>
        p.name === 'variant' && p.type === 'generic-color'
      );

      if (hasVariant) {
        return {
          severity: 'info',
          code: 'A11Y010',
          message: `Component '${component.name}' uses color variants`,
          suggestion: `Ensure all color variants meet WCAG 2.1 contrast requirements (4.5:1 for text, 3:1 for UI)`,
        };
      }
      return null;
    },
  },
];

// =============================================================================
// VALIDATOR
// =============================================================================

export class AccessibilityValidator {
  private customRules: AccessibilityRule[] = [];

  /**
   * Add a custom accessibility rule
   */
  addRule(rule: AccessibilityRule): void {
    this.customRules.push(rule);
  }

  /**
   * Validate a single component
   */
  validate(component: ComponentDefinition): ValidationResult {
    const issues: AccessibilityIssue[] = [];

    // Run built-in rules
    for (const rule of rules) {
      const issue = rule.check(component);
      if (issue) {
        issues.push(issue);
      }
    }

    // Run custom rules
    for (const rule of this.customRules) {
      const issue = rule.check(component);
      if (issue) {
        issues.push(issue);
      }
    }

    return {
      valid: issues.filter(i => i.severity === 'error').length === 0,
      issues,
    };
  }

  /**
   * Validate multiple components
   */
  validateAll(components: ComponentDefinition[]): Map<string, ValidationResult> {
    const results = new Map<string, ValidationResult>();

    for (const component of components) {
      results.set(component.name, this.validate(component));
    }

    return results;
  }

  /**
   * Get summary of all issues
   */
  getSummary(results: Map<string, ValidationResult>): {
    totalComponents: number;
    totalIssues: number;
    errors: number;
    warnings: number;
    info: number;
    valid: boolean;
  } {
    let errors = 0;
    let warnings = 0;
    let info = 0;

    for (const result of results.values()) {
      for (const issue of result.issues) {
        if (issue.severity === 'error') errors++;
        else if (issue.severity === 'warning') warnings++;
        else info++;
      }
    }

    return {
      totalComponents: results.size,
      totalIssues: errors + warnings + info,
      errors,
      warnings,
      info,
      valid: errors === 0,
    };
  }
}

// =============================================================================
// CONVENIENCE FUNCTIONS
// =============================================================================

/**
 * Validate component for accessibility
 */
export function validateAccessibility(
  component: ComponentDefinition
): ValidationResult {
  const validator = new AccessibilityValidator();
  return validator.validate(component);
}

/**
 * Validate all components for accessibility
 */
export function validateAllAccessibility(
  components: ComponentDefinition[]
): Map<string, ValidationResult> {
  const validator = new AccessibilityValidator();
  return validator.validateAll(components);
}
