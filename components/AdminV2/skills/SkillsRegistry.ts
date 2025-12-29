/**
 * SkillsRegistry - Central registry for all skills
 *
 * Manages skill registration, lookup, and intent matching
 */

import { Skill, SkillCategory, UserRole } from './types';

// ============================================
// SKILLS REGISTRY IMPLEMENTATION
// ============================================

class SkillsRegistryImpl {
  private skills: Map<string, Skill> = new Map();
  private categoryIndex: Map<SkillCategory, Set<string>> = new Map();
  private keywordIndex: Map<string, Set<string>> = new Map();

  constructor() {
    // Initialize category index
    const categories: SkillCategory[] = [
      'logistics',
      'finance',
      'analytics',
      'automation',
      'communication',
    ];
    categories.forEach(cat => this.categoryIndex.set(cat, new Set()));
  }

  /**
   * Register a new skill
   */
  register(skill: Skill): void {
    // Store skill
    this.skills.set(skill.id, skill);

    // Update category index
    const categorySkills = this.categoryIndex.get(skill.category);
    if (categorySkills) {
      categorySkills.add(skill.id);
    }

    // Update keyword index
    skill.keywords.forEach(keyword => {
      const normalized = keyword.toLowerCase().trim();
      if (!this.keywordIndex.has(normalized)) {
        this.keywordIndex.set(normalized, new Set());
      }
      this.keywordIndex.get(normalized)!.add(skill.id);
    });

    console.log(`[SkillsRegistry] Registered skill: ${skill.id}`);
  }

  /**
   * Unregister a skill
   */
  unregister(skillId: string): boolean {
    const skill = this.skills.get(skillId);
    if (!skill) return false;

    // Remove from category index
    const categorySkills = this.categoryIndex.get(skill.category);
    if (categorySkills) {
      categorySkills.delete(skillId);
    }

    // Remove from keyword index
    skill.keywords.forEach(keyword => {
      const normalized = keyword.toLowerCase().trim();
      const keywordSkills = this.keywordIndex.get(normalized);
      if (keywordSkills) {
        keywordSkills.delete(skillId);
      }
    });

    // Remove skill
    this.skills.delete(skillId);
    return true;
  }

  /**
   * Get a skill by ID
   */
  get(id: string): Skill | undefined {
    return this.skills.get(id);
  }

  /**
   * Get all registered skills
   */
  getAll(): Skill[] {
    return Array.from(this.skills.values());
  }

  /**
   * Get skills by category
   */
  getByCategory(category: SkillCategory): Skill[] {
    const skillIds = this.categoryIndex.get(category);
    if (!skillIds) return [];

    return Array.from(skillIds)
      .map(id => this.skills.get(id))
      .filter((s): s is Skill => s !== undefined);
  }

  /**
   * Get skills available for a specific role
   */
  getByRole(role: UserRole): Skill[] {
    return Array.from(this.skills.values()).filter(skill => skill.roles.includes(role));
  }

  /**
   * Search skills by query
   */
  search(query: string): Skill[] {
    const normalized = query.toLowerCase().trim();
    const matchedIds = new Set<string>();

    // Search by ID
    if (this.skills.has(normalized)) {
      matchedIds.add(normalized);
    }

    // Search by keyword
    this.keywordIndex.forEach((skillIds, keyword) => {
      if (keyword.includes(normalized) || normalized.includes(keyword)) {
        skillIds.forEach(id => matchedIds.add(id));
      }
    });

    // Search by name and description
    this.skills.forEach((skill, id) => {
      if (
        skill.name.toLowerCase().includes(normalized) ||
        skill.description.toLowerCase().includes(normalized)
      ) {
        matchedIds.add(id);
      }
    });

    return Array.from(matchedIds)
      .map(id => this.skills.get(id))
      .filter((s): s is Skill => s !== undefined);
  }

  /**
   * Match user message to a skill using keyword matching
   * Returns the best matching skill or null
   */
  matchIntent(userMessage: string): { skill: Skill; confidence: number } | null {
    const words = userMessage
      .toLowerCase()
      .split(/\s+/)
      .filter(w => w.length > 2);

    const scores: Map<string, number> = new Map();

    // Score each skill based on keyword matches
    words.forEach(word => {
      this.keywordIndex.forEach((skillIds, keyword) => {
        if (keyword.includes(word) || word.includes(keyword)) {
          const matchQuality = keyword === word ? 2 : 1;
          skillIds.forEach(id => {
            scores.set(id, (scores.get(id) || 0) + matchQuality);
          });
        }
      });
    });

    // Also check examples
    this.skills.forEach((skill, id) => {
      skill.examples.forEach(example => {
        const exampleWords = example.toLowerCase().split(/\s+/);
        let matchCount = 0;
        words.forEach(word => {
          if (exampleWords.some(ew => ew.includes(word) || word.includes(ew))) {
            matchCount++;
          }
        });
        if (matchCount > 0) {
          scores.set(id, (scores.get(id) || 0) + matchCount * 0.5);
        }
      });
    });

    // Find best match
    let bestId: string | null = null;
    let bestScore = 0;

    scores.forEach((score, id) => {
      if (score > bestScore) {
        bestScore = score;
        bestId = id;
      }
    });

    if (bestId && bestScore >= 1) {
      const skill = this.skills.get(bestId)!;
      const maxPossibleScore = skill.keywords.length * 2;
      const confidence = Math.min(bestScore / maxPossibleScore, 1);

      return { skill, confidence };
    }

    return null;
  }

  /**
   * Extract parameters from user message based on skill definition
   */
  extractParams(message: string, skill: Skill): Record<string, any> {
    const params: Record<string, any> = {};

    // Simple extraction patterns
    skill.requiredParams.forEach(param => {
      switch (param.type) {
        case 'string':
          // Look for quoted strings or alphanumeric sequences
          const stringPatterns = [
            /"([^"]+)"/,
            /'([^']+)'/,
            /guia\s+(\w+)/i,
            /numero\s+(\w+)/i,
            /pedido\s+(\w+)/i,
            /(\d{6,})/,
          ];
          for (const pattern of stringPatterns) {
            const match = message.match(pattern);
            if (match) {
              params[param.name] = match[1];
              break;
            }
          }
          break;

        case 'number':
          const numMatch = message.match(/\b(\d+(?:\.\d+)?)\b/);
          if (numMatch) {
            params[param.name] = parseFloat(numMatch[1]);
          }
          break;

        case 'date':
          // Look for date patterns
          const datePatterns = [
            /(\d{4}-\d{2}-\d{2})/,
            /(\d{2}\/\d{2}\/\d{4})/,
            /hoy/i,
            /ayer/i,
            /esta semana/i,
          ];
          for (const pattern of datePatterns) {
            const match = message.match(pattern);
            if (match) {
              if (match[0].toLowerCase() === 'hoy') {
                params[param.name] = new Date().toISOString().split('T')[0];
              } else if (match[0].toLowerCase() === 'ayer') {
                const yesterday = new Date();
                yesterday.setDate(yesterday.getDate() - 1);
                params[param.name] = yesterday.toISOString().split('T')[0];
              } else {
                params[param.name] = match[1];
              }
              break;
            }
          }
          break;

        case 'boolean':
          if (/\b(si|yes|true|activar|habilitar)\b/i.test(message)) {
            params[param.name] = true;
          } else if (/\b(no|false|desactivar|deshabilitar)\b/i.test(message)) {
            params[param.name] = false;
          }
          break;
      }
    });

    return params;
  }

  /**
   * Get count of registered skills
   */
  get count(): number {
    return this.skills.size;
  }

  /**
   * Get count by category
   */
  getCountByCategory(): Record<SkillCategory, number> {
    const counts: Record<string, number> = {};
    this.categoryIndex.forEach((skillIds, category) => {
      counts[category] = skillIds.size;
    });
    return counts as Record<SkillCategory, number>;
  }
}

// ============================================
// SINGLETON EXPORT
// ============================================

export const SkillsRegistry = new SkillsRegistryImpl();

export default SkillsRegistry;
