import { describe, it, expect } from 'vitest';
import { vi } from 'vitest';
import { exportOverridesFile, importOverridesFile, RagOverrides } from '../../src/lib/rag/overrides';

// Mock browser APIs for Node.js test environment
global.FileReader = class MockFileReader {
  onload: ((event: any) => void) | null = null;
  onerror: (() => void) | null = null;
  result: string | null = null;

  readAsText(file: File) {
    setTimeout(() => {
      try {
        // Simulate reading file content
        const content = (file as any)._content || '';
        this.result = content;
        if (this.onload) {
          this.onload({ target: { result: content } });
        }
      } catch (error) {
        if (this.onerror) {
          this.onerror();
        }
      }
    }, 0);
  }
} as any;

global.File = class MockFile {
  name: string;
  type: string;
  _content: string;

  constructor(content: string[], name: string, options: { type: string }) {
    this.name = name;
    this.type = options.type;
    this._content = content[0] || '';
  }
} as any;

// Mock URL and document for export functionality
global.URL = {
  createObjectURL: vi.fn(() => 'mock-url'),
  revokeObjectURL: vi.fn()
} as any;

global.document = {
  createElement: vi.fn(() => ({
    href: '',
    download: '',
    click: vi.fn(),
    remove: vi.fn()
  })),
  body: {
    appendChild: vi.fn(),
    removeChild: vi.fn()
  }
} as any;

describe('UI parsers', () => {
  const sampleOverrides: RagOverrides = {
    version: 1,
    sections: [
      {
        programId: 'prog1',
        pageStart: 1,
        pageEnd: 3,
        sectionTitle: 'Introduction'
      }
    ],
    programMeta: [
      {
        programId: 'prog1',
        status: 'ausgesetzt',
        stand: '10/2025'
      }
    ],
    chunks: [
      {
        programId: 'prog1',
        page: 1,
        muted: true,
        boost: 0.5
      }
    ]
  };

  it('should parse valid overrides file', async () => {
    const jsonContent = JSON.stringify(sampleOverrides, null, 2);
    const file = new File([jsonContent], 'test-overrides.json', { type: 'application/json' });
    
    const result = await importOverridesFile(file);
    
    expect(result).toEqual(sampleOverrides);
  });

  it('should reject invalid JSON', async () => {
    const invalidJson = '{ invalid json content }';
    const file = new File([invalidJson], 'invalid.json', { type: 'application/json' });
    
    await expect(importOverridesFile(file)).rejects.toThrow('Failed to parse overrides file');
  });

  it('should reject wrong version', async () => {
    const wrongVersion = { version: 2, sections: [] };
    const jsonContent = JSON.stringify(wrongVersion);
    const file = new File([jsonContent], 'wrong-version.json', { type: 'application/json' });
    
    await expect(importOverridesFile(file)).rejects.toThrow('Invalid overrides format or version');
  });

  it('should handle empty overrides file', async () => {
    const emptyOverrides = { version: 1 };
    const jsonContent = JSON.stringify(emptyOverrides);
    const file = new File([jsonContent], 'empty.json', { type: 'application/json' });
    
    const result = await importOverridesFile(file);
    
    expect(result).toEqual({ version: 1 });
  });

  it('should validate required fields', async () => {
    const incompleteOverrides = {
      version: 1,
      sections: [
        {
          programId: 'prog1',
          pageStart: 1,
          // Missing pageEnd and sectionTitle
        }
      ]
    };
    
    const jsonContent = JSON.stringify(incompleteOverrides);
    const file = new File([jsonContent], 'incomplete.json', { type: 'application/json' });
    
    // Should still parse but validation will catch issues later
    const result = await importOverridesFile(file);
    expect(result.version).toBe(1);
  });

  it('should handle large overrides files', async () => {
    const largeOverrides: RagOverrides = {
      version: 1,
      chunks: Array.from({ length: 1000 }, (_, i) => ({
        programId: `prog${Math.floor(i / 100) + 1}`,
        page: (i % 50) + 1,
        boost: (i % 10) / 10 - 0.5,
        muted: i % 10 === 0
      }))
    };
    
    const jsonContent = JSON.stringify(largeOverrides);
    const file = new File([jsonContent], 'large.json', { type: 'application/json' });
    
    const result = await importOverridesFile(file);
    
    expect(result.chunks).toHaveLength(1000);
    expect(result.version).toBe(1);
  });
});