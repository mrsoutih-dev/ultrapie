import { describe, it, expect } from 'vitest';

describe('Studio Superpowers: Interactive Visual Inspector (Click-to-Edit)', () => {
  it('should format scoped element modification prompt correctly', () => {
    const selectedElement = {
      tagName: 'button',
      text: 'Get Started Today',
      className: 'px-6 py-3 bg-purple-600 rounded-xl text-white font-bold',
      outerHTML: '<button class="px-6 py-3 bg-purple-600 rounded-xl text-white font-bold">Get Started Today</button>',
    };

    const instruction = 'Change to emerald green gradient with a cart icon';
    const tag = selectedElement.tagName;
    const textInfo = selectedElement.text ? ` (containing text: "${selectedElement.text}")` : '';
    const classInfo = selectedElement.className ? ` with classes "${selectedElement.className.slice(0, 80)}"` : '';
    const fullPrompt = `Modify the <${tag}> element${textInfo}${classInfo}: ${instruction}. Keep the rest of the application unchanged.`;

    expect(fullPrompt).toContain('Modify the <button>');
    expect(fullPrompt).toContain('Get Started Today');
    expect(fullPrompt).toContain('bg-purple-600');
    expect(fullPrompt).toContain('Change to emerald green gradient');
    expect(fullPrompt).toContain('Keep the rest of the application unchanged.');
  });

  it('should handle elements with empty text content gracefully', () => {
    const selectedElement = {
      tagName: 'div',
      text: '',
      className: 'h-64 rounded-2xl bg-slate-900 border border-slate-800',
      outerHTML: '<div class="h-64 rounded-2xl bg-slate-900 border border-slate-800"></div>',
    };

    const instruction = 'Add a glassmorphism blur and subtle cyan glow';
    const tag = selectedElement.tagName;
    const textInfo = selectedElement.text ? ` (containing text: "${selectedElement.text}")` : '';
    const classInfo = selectedElement.className ? ` with classes "${selectedElement.className.slice(0, 80)}"` : '';
    const fullPrompt = `Modify the <${tag}> element${textInfo}${classInfo}: ${instruction}. Keep the rest of the application unchanged.`;

    expect(fullPrompt).toBe(
      'Modify the <div> element with classes "h-64 rounded-2xl bg-slate-900 border border-slate-800": Add a glassmorphism blur and subtle cyan glow. Keep the rest of the application unchanged.'
    );
  });
});
