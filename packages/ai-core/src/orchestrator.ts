import { z } from 'zod';
import { FilePatch, AIUsageReport } from '@ultrapie/shared';
import { IAIProvider, AIRequestContext } from './types.js';
import { PatchValidator } from './patch-validator.js';
import { TokenMeter } from './token-meter.js';

export const MultiFilePatchSchema = z.object({
  reply: z.string().default('I am ready to help you with your project.'),
  isCodeAction: z.boolean().default(false),
  patches: z
    .array(
      z.object({
        path: z.string(),
        operation: z.enum(['create', 'update', 'delete']),
        content: z.string().optional(),
      })
    )
    .default([]),
});

export type MultiFilePatchResponse = z.infer<typeof MultiFilePatchSchema>;

export interface OrchestrationResult {
  reply: string;
  isCodeAction: boolean;
  summary: string;
  patches: FilePatch[];
  updatedFiles: Record<string, string>;
  usage: AIUsageReport;
}

export interface ExtendedRequestContext extends AIRequestContext {
  chatHistory?: Array<{ role: 'user' | 'assistant'; content: string }>;
}

export class AICodeOrchestrator {
  constructor(private provider: IAIProvider) {}

  /**
   * Processes a user prompt: acts as a conversational chatbot first,
   * and generates code patches ONLY when ordered to develop/modify code.
   */
  async processUserPrompt(
    prompt: string,
    context: ExtendedRequestContext = { projectId: 'default' }
  ): Promise<OrchestrationResult> {
    const systemInstructions = this.buildSystemPrompt(context);

    let historyText = '';
    if (context.chatHistory && context.chatHistory.length > 0) {
      historyText =
        'Recent conversation history:\n' +
        context.chatHistory
          .slice(-6)
          .map((m) => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`)
          .join('\n') +
        '\n\n';
    }

    const fullPrompt = `${systemInstructions}\n\n${historyText}CURRENT USER INPUT: ${prompt}\n\nOutput valid JSON with the following structure:
{
  "reply": "Conversational reply or explanation",
  "isCodeAction": false, // set to true ONLY if user commanded code modifications
  "patches": [] // array of { "path": string, "operation": "create"|"update"|"delete", "content": string }
}`;

    const { data, usage } = await this.provider.structuredOutput(
      fullPrompt,
      MultiFilePatchSchema,
      context
    );

    const reply = data.reply || 'I am ready to help you with your project.';
    const rawPatches = data.patches || [];
    const isCodeAction = Boolean(data.isCodeAction && rawPatches.length > 0);

    const safePatches: FilePatch[] = isCodeAction
      ? rawPatches.map((p) => ({
          path: p.path,
          operation: p.operation,
          content: p.content || '',
        }))
      : [];

    let updatedFiles = context.existingFiles || {};

    // Only apply patches if there are actual code changes ordered
    if (isCodeAction && safePatches.length > 0) {
      PatchValidator.validate(safePatches);
      updatedFiles = PatchValidator.applyPatches(updatedFiles, safePatches);
    }

    // Calculate usage & cost
    const usageReport = TokenMeter.calculateUsage(
      usage.promptTokens,
      usage.candidateTokens,
      this.provider.providerName
    );

    return {
      reply,
      isCodeAction,
      summary: reply,
      patches: safePatches,
      updatedFiles,
      usage: usageReport,
    };
  }

  /**
   * Executes an automated self-repair attempt when build errors occur.
   */
  async repairBuildErrors(
    buildErrorMessage: string,
    context: AIRequestContext
  ): Promise<OrchestrationResult> {
    const repairPrompt = `The previous code build failed with the following errors:\n\n${buildErrorMessage}\n\nPlease analyze the errors, explain the fix in your reply, and output corrected patches with isCodeAction=true.`;
    return this.processUserPrompt(repairPrompt, context);
  }

  private buildSystemPrompt(context: AIRequestContext): string {
    const existingFileNames = context.existingFiles
      ? Object.keys(context.existingFiles).join(', ')
      : 'None';

    return `You are Ultrapie's AI Assistant and Pair Programmer.
You work in two modes:

1. CHATBOT MODE (DEFAULT):
- When the user is greeting you, asking general questions, discussing ideas, or chatting without commanding code modifications, converse normally and helpfully.
- Set isCodeAction = false and keep patches = [].

2. DEVELOPER / CODING MODE:
- When the user explicitly asks you to build, create, add, edit, modify, delete, or refactor code (e.g. "build a landing page", "create a portfolio", "create an e-commerce store", "add a button", "fix this error"), fulfill the request by:
  a) Explaining what you built in your reply.
  b) Setting isCodeAction = true.
  c) Providing complete, working file contents in patches. When building a new app or site, always produce "src/App.tsx" as a complete, self-contained React component styled with Tailwind CSS, along with "src/index.css" and "package.json".
  d) Make the UI modern, attractive, and responsive with rich layout sections, engaging typography, and interactive buttons/state.

Framework: ${context.framework || 'vite-react'}
Current files in workspace: ${existingFileNames}

Rules:
- Never return placeholder code like "// ...rest of code" or "// TODO". Always output complete, valid files in patches.
- Keep paths relative to workspace root (e.g. "src/App.tsx"). Never modify .env or secret files.`;
  }
}
