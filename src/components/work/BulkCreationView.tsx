'use client';

import React, { useState } from 'react';
import {
  Sparkles,
  Play,
  Copy,
  Check,
  RotateCcw,
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
  User,
  Factory,
  Layers,
  Shirt,
  Calendar,
  ArrowRight,
  ListPlus,
  HelpCircle,
} from 'lucide-react';
import { useAdminStore } from '@/lib/store';
import { WorkItem, WorkItemPriority, WorkItemState, WorkItemType } from '@/lib/types';
import { TYPE_COLOR, STATE_COLOR, PRIORITY_BADGE_COLOR, PRIORITY_LABEL } from '@/components/work/WorkItemModal';

const SAMPLE_YAML = `
- user_story: "Finalize proto sample fit & sizing specs for Drop 1 Leggings"
  story_type: "User Story"
  priority: "P1"
  points: 5
  assignee: "Unassigned"
  sprint: "Sprint 1"
  manufacture: "Techno Sportswear"
  styles: "Leggings, Sports Bra"
  description: "Lead fit sessions with sample master. Verify waistband elasticity, high-rise seam placement, and 4-way squat-proof density under 240 GSM."
  acceptance_criteria: "Fit trial approved across XS, S, and M. Zero roll-down on waistband during movement testing."
  tasks:
    - title: "Audit proto sample waist tension & stretch recovery"
      priority: "P1"
      points: 2
      assignee: "Unassigned"
    - title: "Log measurement delta between tech-pack spec and physical sample"
      priority: "P2"
      points: 1
      assignee: "Unassigned"
    - title: "Request second proto adjustment for leg hem flatlock seams"
      priority: "P2"
      points: 1
      assignee: "Unassigned"

- user_story: "Lab Dip Colorfastness & D65 Lighting Booth Verification"
  story_type: "User Story"
  priority: "P2"
  points: 3
  assignee: "Unassigned"
  sprint: "Sprint 1"
  manufacture: "Techno Sportswear"
  styles: "All Styles"
  description: "Inspect and sign off on fabric lab dips in Midnight and Cardamom colorways for all 6 launch styles."
  acceptance_criteria: "Delta-E color difference is under 0.8 compared to Pantone TCX standard swatch. Washing colorfastness grade 4.5+."
  tasks:
    - title: "Review color swatches under D65, TL84, and daylight lamps"
      priority: "P1"
      points: 1
      assignee: "Unassigned"
    - title: "Send signed swatch physical approvals back to factory"
      priority: "P2"
      points: 1
      assignee: "Unassigned"
`.trim();

const SAMPLE_JSON = JSON.stringify(
  [
    {
      user_story: 'Finalize proto sample fit & sizing specs for Drop 1 Leggings',
      story_type: 'User Story',
      priority: 'P1',
      points: 5,
      assignee: 'Unassigned',
      sprint: 'Sprint 1',
      manufacture: 'Techno Sportswear',
      styles: 'Leggings, Sports Bra',
      description: 'Lead fit sessions with sample master. Verify waistband elasticity, high-rise seam placement, and 4-way squat-proof density under 240 GSM.',
      acceptance_criteria: 'Fit trial approved across XS, S, and M. Zero roll-down on waistband during movement testing.',
      tasks: [
        {
          title: 'Audit proto sample waist tension & stretch recovery',
          priority: 'P1',
          points: 2,
          assignee: 'Unassigned',
        },
        {
          title: 'Log measurement delta between tech-pack spec and physical sample',
          priority: 'P2',
          points: 1,
          assignee: 'Unassigned',
        },
      ],
    },
  ],
  null,
  2
);

interface ParsedTask {
  title: string;
  priority: WorkItemPriority;
  points?: number;
  assignee?: string;
  description?: string;
}

interface ParsedStory {
  title: string;
  type: WorkItemType;
  priority: WorkItemPriority;
  points?: number;
  assignee: string;
  sprintName?: string;
  sprintId?: string;
  vendorName?: string;
  vendorId?: string;
  stylesText?: string;
  styleIds?: string[];
  operationCategory?: string;
  description?: string;
  acceptanceCriteria?: string;
  tasks: ParsedTask[];
}

interface BulkCreationViewProps {
  onNavigateToBoard?: (sprintId?: string) => void;
  onNavigateToBacklog?: () => void;
}

export default function BulkCreationView({ onNavigateToBoard, onNavigateToBacklog }: BulkCreationViewProps) {
  const { sprints, vendors, pipelineItems, saveWorkItemsBulk } = useAdminStore();

  const [rawInput, setRawInput] = useState('');
  const [formatMode, setFormatMode] = useState<'yaml' | 'json'>('yaml');
  const [copiedPrompt, setCopiedPrompt] = useState(false);
  const [copiedTemplate, setCopiedTemplate] = useState(false);
  const [parsedStories, setParsedStories] = useState<ParsedStory[]>([]);
  const [parseErrors, setParseErrors] = useState<string[]>([]);
  const [isCreatedSuccess, setIsCreatedSuccess] = useState(false);
  const [createdSummary, setCreatedSummary] = useState<{ stories: number; tasks: number } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Helper to match sprint
  const resolveSprintId = (sprintStr?: string): string | undefined => {
    if (!sprintStr) return sprints[0]?.id;
    const clean = sprintStr.trim().toLowerCase();
    const found = sprints.find(
      (s) =>
        s.id.toLowerCase() === clean ||
        s.name.toLowerCase().includes(clean) ||
        (clean.includes('1') && s.name.includes('1')) ||
        (clean.includes('2') && s.name.includes('2'))
    );
    return found ? found.id : sprints[0]?.id;
  };

  // Helper to match vendor
  const resolveVendorId = (vendorStr?: string): string | undefined => {
    if (!vendorStr) return undefined;
    const clean = vendorStr.trim().toLowerCase();
    const found = vendors.find((v) => v.name.toLowerCase().includes(clean) || clean.includes(v.name.toLowerCase()));
    return found ? found.id : undefined;
  };

  // Helper to match styles
  const resolveStyleIds = (stylesStr?: string): string[] => {
    if (!stylesStr) return [];
    const clean = stylesStr.trim().toLowerCase();
    if (clean.includes('all') || clean.includes('strain') || clean.includes('everything')) {
      return ['all'];
    }
    const matched: string[] = [];
    for (const p of pipelineItems) {
      if (clean.includes(p.styleName.toLowerCase())) {
        matched.push(p.id);
      }
    }
    return matched.length > 0 ? matched : [];
  };

  // Helper to parse priority
  const resolvePriority = (pVal?: any): WorkItemPriority => {
    if (!pVal) return 2;
    const str = String(pVal).trim().toUpperCase();
    if (str.includes('1') || str.includes('CRITICAL')) return 1;
    if (str.includes('2') || str.includes('HIGH')) return 2;
    if (str.includes('3') || str.includes('MED')) return 3;
    if (str.includes('4') || str.includes('LOW')) return 4;
    return 2;
  };

  // Smart Parser that handles JSON, YAML-like block format, and key-value entries
  const handleParse = () => {
    setParseErrors([]);
    setIsCreatedSuccess(false);

    const input = rawInput.trim();
    if (!input) {
      setParseErrors(['Please enter or paste data into the raw input box before running.']);
      return;
    }

    // Try parsing as JSON first
    if (input.startsWith('[') || input.startsWith('{')) {
      try {
        const parsed = JSON.parse(input);
        const list = Array.isArray(parsed) ? parsed : [parsed];
        const stories: ParsedStory[] = [];

        for (const item of list) {
          const title = item.user_story || item.title || item.story || item.name;
          if (!title) continue;

          const rawTasks = Array.isArray(item.tasks) ? item.tasks : [];
          const tasks: ParsedTask[] = rawTasks.map((t: any) => ({
            title: t.title || t.name || t.task || 'Task',
            priority: resolvePriority(t.priority),
            points: t.points !== undefined ? Number(t.points) : 1,
            assignee: t.assignee || item.assignee || 'Unassigned',
            description: t.description,
          }));

          stories.push({
            title: String(title).trim(),
            type: (item.story_type || item.type || 'User Story') as WorkItemType,
            priority: resolvePriority(item.priority),
            points: item.points ? Number(item.points) : (item.story_points ? Number(item.story_points) : 3),
            assignee: item.assignee || 'Unassigned',
            sprintName: item.sprint || item.sprints,
            sprintId: resolveSprintId(item.sprint || item.sprints),
            vendorName: item.manufacture || item.manufacturer || item.vendor,
            vendorId: resolveVendorId(item.manufacture || item.manufacturer || item.vendor),
            stylesText: item.styles || item.style || (Array.isArray(item.styles) ? item.styles.join(', ') : undefined),
            styleIds: resolveStyleIds(Array.isArray(item.styles) ? item.styles.join(', ') : item.styles),
            operationCategory: item.operation || item.operation_category || 'Operations & Sourcing',
            description: item.description,
            acceptanceCriteria: item.acceptance_criteria || item.acceptanceCriteria,
            tasks,
          });
        }

        if (stories.length === 0) {
          setParseErrors(['Could not detect valid user stories in the JSON input. Please verify the structure.']);
        } else {
          setParsedStories(stories);
        }
        return;
      } catch (e: any) {
        // Not valid JSON, proceed to YAML/Text parsing below
      }
    }

    // YAML / Structured Line Parser
    try {
      const lines = input.split('\n');
      const stories: ParsedStory[] = [];
      let currentStory: Partial<ParsedStory> | null = null;
      let currentTask: Partial<ParsedTask> | null = null;
      let insideTasks = false;

      for (let i = 0; i < lines.length; i++) {
        const rawLine = lines[i];
        const line = rawLine.trim();

        if (!line) continue;

        // Check if starting a new story
        if (
          line.startsWith('- user_story:') ||
          line.startsWith('- story:') ||
          line.startsWith('- title:') ||
          (line.startsWith('User Story:') && !insideTasks) ||
          (line.startsWith('Story:') && !insideTasks)
        ) {
          if (currentStory && currentStory.title) {
            if (currentTask && currentTask.title) {
              currentStory.tasks = currentStory.tasks || [];
              currentStory.tasks.push(currentTask as ParsedTask);
              currentTask = null;
            }
            stories.push(currentStory as ParsedStory);
          }

          insideTasks = false;
          currentTask = null;
          const colonIdx = line.indexOf(':');
          const titleVal = line.slice(colonIdx + 1).replace(/^[\s"']+|[\s"']+$/g, '');

          currentStory = {
            title: titleVal,
            type: 'User Story',
            priority: 2,
            points: 3,
            assignee: undefined,
            tasks: [],
          };
          continue;
        }

        if (!currentStory) {
          // If first line doesn't have '-' prefix, create default story container
          currentStory = {
            title: line.replace(/^#+\s*/, ''),
            type: 'User Story',
            priority: 2,
            points: 3,
            assignee: undefined,
            tasks: [],
          };
          continue;
        }

        // Inside tasks section
        if (line.toLowerCase().startsWith('tasks:') || line.toLowerCase().startsWith('subtasks:')) {
          insideTasks = true;
          continue;
        }

        if (insideTasks) {
          // Task entry
          if (line.startsWith('- title:') || line.startsWith('- task:') || line.startsWith('- ')) {
            if (currentTask && currentTask.title) {
              currentStory.tasks = currentStory.tasks || [];
              currentStory.tasks.push(currentTask as ParsedTask);
            }
            const content = line.replace(/^-\s*(title:|task:)?\s*/i, '').replace(/^["']|["']$/g, '');
            currentTask = {
              title: content,
              priority: 2,
              points: 1,
              assignee: currentStory.assignee || undefined,
            };
            continue;
          }

          if (currentTask) {
            const colonIdx = line.indexOf(':');
            if (colonIdx > 0) {
              const key = line.slice(0, colonIdx).trim().toLowerCase();
              const val = line.slice(colonIdx + 1).replace(/^[\s"']+|[\s"']+$/g, '');
              if (key.includes('priority')) currentTask.priority = resolvePriority(val);
              if (key.includes('point')) currentTask.points = Number(val) || 1;
              if (key.includes('assignee')) currentTask.assignee = val.toLowerCase() === 'unassigned' ? undefined : (val || undefined);
            }
            continue;
          }
        }

        // Story Attributes
        const colonIdx = line.indexOf(':');
        if (colonIdx > 0 && !insideTasks) {
          const key = line.slice(0, colonIdx).trim().toLowerCase().replace(/^[-_\s]+/, '');
          const val = line.slice(colonIdx + 1).replace(/^[\s"']+|[\s"']+$/g, '');

          if (key === 'user_story' || key === 'story' || key === 'title') {
            currentStory.title = val;
          } else if (key === 'story_type' || key === 'type') {
            currentStory.type = val as WorkItemType;
          } else if (key === 'priority') {
            currentStory.priority = resolvePriority(val);
          } else if (key === 'points' || key === 'story_points' || key === 'new priority points') {
            currentStory.points = Number(val) || 3;
          } else if (key === 'assignee' || key === 'assigned or unassigned') {
            currentStory.assignee = val.toLowerCase() === 'unassigned' ? undefined : (val || undefined);
          } else if (key === 'sprint' || key === 'sprints') {
            currentStory.sprintName = val;
            currentStory.sprintId = resolveSprintId(val);
          } else if (key === 'manufacture' || key === 'manufacturer' || key === 'vendor') {
            currentStory.vendorName = val;
            currentStory.vendorId = resolveVendorId(val);
          } else if (key === 'styles' || key === 'style' || key === 'products') {
            currentStory.stylesText = val;
            currentStory.styleIds = resolveStyleIds(val);
          } else if (key === 'operation' || key === 'operation_category') {
            currentStory.operationCategory = val;
          } else if (key === 'description') {
            currentStory.description = val;
          } else if (key === 'acceptance_criteria' || key === 'acceptance criteria') {
            currentStory.acceptanceCriteria = val;
          }
        }
      }

      if (currentTask && currentTask.title && currentStory) {
        currentStory.tasks = currentStory.tasks || [];
        currentStory.tasks.push(currentTask as ParsedTask);
      }
      if (currentStory && currentStory.title) {
        stories.push(currentStory as ParsedStory);
      }

      if (stories.length === 0) {
        setParseErrors([
          'Could not parse any User Stories from the provided text. Please ensure lines start with "- user_story: ..." or click "Load Sample Data" to view the expected format.',
        ]);
      } else {
        // Normalize IDs and defaults
        for (const s of stories) {
          if (!s.sprintId) s.sprintId = resolveSprintId(s.sprintName);
          if (!s.vendorId && s.vendorName) s.vendorId = resolveVendorId(s.vendorName);
          if (!s.styleIds && s.stylesText) s.styleIds = resolveStyleIds(s.stylesText);
          if (!s.assignee) s.assignee = 'Unassigned';
        }
        setParsedStories(stories);
      }
    } catch (err: any) {
      setParseErrors([`Parsing failed: ${err.message || 'Unknown error'}`]);
    }
  };

  // Commit all parsed stories and subtasks
  const handleCreateAll = async () => {
    if (parsedStories.length === 0 || isSubmitting) return;

    setIsSubmitting(true);
    const now = new Date().toISOString();
    const allItemsToSave: WorkItem[] = [];

    let totalStoryCount = 0;
    let totalTaskCount = 0;

    for (let i = 0; i < parsedStories.length; i++) {
      const s = parsedStories[i];
      const storyId = `wi-${Date.now()}-${i + 1}`;
      totalStoryCount++;

      const storyItem: WorkItem = {
        id: storyId,
        type: s.type || 'User Story',
        title: s.title,
        description: s.description || '',
        acceptanceCriteria: s.acceptanceCriteria || '',
        state: 'New',
        priority: s.priority || 2,
        order: i + 1,
        storyPoints: s.points || 3,
        assignee: s.assignee && s.assignee !== 'Unassigned' ? s.assignee : undefined,
        sprintId: s.sprintId || sprints[0]?.id,
        linkedVendorId: s.vendorId,
        linkedPipelineItemIds: s.styleIds || [],
        linkedPipelineItemId: s.styleIds && s.styleIds.length > 0 && s.styleIds[0] !== 'all' ? s.styleIds[0] : undefined,
        operationCategory: s.operationCategory || 'Operations & Sourcing',
        tags: ['AI-Imported'],
        comments: [
          {
            id: `cm-${Date.now()}-${i}`,
            author: 'System (AI Importer)',
            text: `Imported via Bulk Creation module on ${new Date().toLocaleDateString()}.`,
            createdAt: now,
          },
        ],
        createdAt: now,
        updatedAt: now,
      };

      allItemsToSave.push(storyItem);

      // Create linked tasks under this story
      if (s.tasks && s.tasks.length > 0) {
        for (let j = 0; j < s.tasks.length; j++) {
          const t = s.tasks[j];
          totalTaskCount++;
          const taskId = `wi-${Date.now()}-${i + 1}-t${j + 1}`;

          const taskItem: WorkItem = {
            id: taskId,
            type: 'Task',
            title: t.title,
            description: t.description || `Task for: ${s.title}`,
            state: 'New',
            priority: t.priority || 2,
            order: j + 1,
            storyPoints: t.points || 1,
            parentId: storyId, // Linked to parent story!
            sprintId: s.sprintId || sprints[0]?.id,
            assignee: t.assignee && t.assignee !== 'Unassigned' ? t.assignee : (s.assignee && s.assignee !== 'Unassigned' ? s.assignee : undefined),
            linkedVendorId: s.vendorId,
            linkedPipelineItemIds: s.styleIds || [],
            operationCategory: s.operationCategory || 'Operations & Sourcing',
            tags: ['AI-Imported'],
            comments: [],
            createdAt: now,
            updatedAt: now,
          };

          allItemsToSave.push(taskItem);
        }
      }
    }

    try {
      await saveWorkItemsBulk(allItemsToSave);
      setIsCreatedSuccess(true);
      setCreatedSummary({ stories: totalStoryCount, tasks: totalTaskCount });
      setParsedStories([]);
      setRawInput('');
    } catch (e: any) {
      setParseErrors([`Failed to create items: ${e.message || 'Unknown error'}`]);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopyPrompt = () => {
    const promptText = `
Please generate software / apparel production user stories and child tasks for Rivlet apparel brand in the following format. Leave "assignee" as "Unassigned" unless specifically assigned.

Format:
- user_story: "[Title of user story]"
  story_type: "User Story"
  priority: "P1" # P1, P2, P3, P4
  points: 5 # 1, 2, 3, 5, 8
  assignee: "Unassigned"
  sprint: "Sprint 1"
  manufacture: "Techno Sportswear" # or Wings2Fashion
  styles: "All Styles" # or "Leggings, Sports Bra"
  description: "[Detailed description without word count restriction]"
  acceptance_criteria: "[Checklist of done criteria]"
  tasks:
    - title: "[Subtask 1 action]"
      priority: "P1"
      points: 1
      assignee: "Unassigned"
    - title: "[Subtask 2 action]"
      priority: "P2"
      points: 2
      assignee: "Unassigned"
`.trim();

    navigator.clipboard.writeText(promptText);
    setCopiedPrompt(true);
    setTimeout(() => setCopiedPrompt(false), 2000);
  };

  const handleCopyTemplate = () => {
    navigator.clipboard.writeText(formatMode === 'yaml' ? SAMPLE_YAML : SAMPLE_JSON);
    setCopiedTemplate(true);
    setTimeout(() => setCopiedTemplate(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Module Info */}
      <div className="rounded-2xl border border-[#1b2233] bg-gradient-to-r from-[#0c1018] via-[#101625] to-[#0c1018] p-5 sm:p-6 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="p-2 rounded-xl bg-[#cda052]/10 border border-[#cda052]/30 text-[#e6c875]">
                <Sparkles className="w-5 h-5 text-[#cda052]" />
              </span>
              <h2 className="text-lg sm:text-xl font-bold text-white">Bulk Creation & AI Importer</h2>
            </div>
            <p className="text-xs sm:text-sm text-[#94a3b8] max-w-2xl">
              Paste structured story & task data generated with your AI tools (Claude, ChatGPT, Gemini). The importer automatically creates both the User Stories and their corresponding child Tasks with unassigned default.
            </p>
          </div>

          <div className="flex items-center flex-wrap gap-2.5 flex-shrink-0">
            <button
              onClick={handleCopyPrompt}
              title="Copy prompt for your AI tool"
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#141926] border border-[#222c42] text-xs font-semibold text-[#cbd5e1] hover:text-white hover:border-[#38486b] transition-all"
            >
              {copiedPrompt ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-[#cda052]" />}
              {copiedPrompt ? 'Prompt Copied!' : 'Copy AI Prompt'}
            </button>
            <button
              onClick={() => {
                setRawInput(SAMPLE_YAML);
                setFormatMode('yaml');
              }}
              title="Load realistic sample data"
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#141926] border border-[#222c42] text-xs font-semibold text-[#cbd5e1] hover:text-white hover:border-[#38486b] transition-all"
            >
              <RotateCcw className="w-3.5 h-3.5 text-[#cda052]" /> Load Sample
            </button>
          </div>
        </div>
      </div>

      {/* Success Notification */}
      {isCreatedSuccess && createdSummary && (
        <div className="rounded-2xl border border-emerald-800/60 bg-emerald-950/40 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-900/60 border border-emerald-600/40 text-emerald-400 flex items-center justify-center flex-shrink-0">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Work Items Successfully Created!</h3>
              <p className="text-xs text-emerald-200/80 mt-0.5">
                Created {createdSummary.stories} User Stor{createdSummary.stories === 1 ? 'y' : 'ies'} and {createdSummary.tasks} Task{createdSummary.tasks === 1 ? '' : 's'}.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => onNavigateToBoard?.()}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-[#cda052] to-[#a97f38] text-black text-xs font-semibold hover:shadow-glow transition-all"
            >
              View on Sprint Board <ArrowRight className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => onNavigateToBacklog?.()}
              className="px-3.5 py-2 rounded-xl bg-[#0a0c12] border border-[#222c42] text-xs font-semibold text-[#cbd5e1] hover:text-white"
            >
              View Backlog
            </button>
          </div>
        </div>
      )}

      {/* Main Grid: Template Box & Raw Data Box */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Template Specification & Guide */}
        <div className="lg:col-span-5 space-y-4">
          <div className="rounded-2xl border border-[#1b2233] bg-[#0c1018] p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-[#171d2b] pb-3">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="w-4 h-4 text-[#cda052]" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-white">Expected Data Template</h3>
              </div>
              <div className="flex items-center gap-1 bg-[#07090f] p-0.5 rounded-lg border border-[#1a2233]">
                <button
                  onClick={() => setFormatMode('yaml')}
                  className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${
                    formatMode === 'yaml' ? 'bg-[#cda052] text-black' : 'text-[#8493ab] hover:text-white'
                  }`}
                >
                  YAML
                </button>
                <button
                  onClick={() => setFormatMode('json')}
                  className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${
                    formatMode === 'json' ? 'bg-[#cda052] text-black' : 'text-[#8493ab] hover:text-white'
                  }`}
                >
                  JSON
                </button>
              </div>
            </div>

            <p className="text-xs text-[#94a3b8] leading-relaxed">
              Match your prompt to include these exact fields. Tasks nested inside each story will automatically link as child sub-tasks!
            </p>

            <div className="relative">
              <pre className="p-3.5 rounded-xl bg-[#07090e] border border-[#192235] text-[11px] font-mono text-[#a5b4fc] overflow-x-auto max-h-72 leading-relaxed">
                {formatMode === 'yaml' ? SAMPLE_YAML : SAMPLE_JSON}
              </pre>
              <button
                onClick={handleCopyTemplate}
                title="Copy template"
                className="absolute top-2 right-2 p-1.5 rounded-lg bg-[#141926]/90 border border-[#222c42] text-[#94a3b8] hover:text-white hover:bg-[#1a2133] transition-colors"
              >
                {copiedTemplate ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>

            {/* Field Legend */}
            <div className="space-y-1.5 pt-2 border-t border-[#171d2b]">
              <h4 className="text-[11px] font-semibold text-[#64748b] uppercase tracking-wider">Field Mapping:</h4>
              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div className="text-[#cbd5e1]"><span className="text-[#cda052] font-semibold">user_story:</span> Story title</div>
                <div className="text-[#cbd5e1]"><span className="text-[#cda052] font-semibold">assignee:</span> Unassigned / Name</div>
                <div className="text-[#cbd5e1]"><span className="text-[#cda052] font-semibold">priority:</span> P1, P2, P3, P4</div>
                <div className="text-[#cbd5e1]"><span className="text-[#cda052] font-semibold">points:</span> 1 to 8 pts</div>
                <div className="text-[#cbd5e1]"><span className="text-[#cda052] font-semibold">sprint:</span> Sprint 1, Sprint 2</div>
                <div className="text-[#cbd5e1]"><span className="text-[#cda052] font-semibold">manufacture:</span> Vendor partner</div>
                <div className="text-[#cbd5e1]"><span className="text-[#cda052] font-semibold">styles:</span> All Styles / single</div>
                <div className="text-[#cbd5e1]"><span className="text-[#cda052] font-semibold">tasks:</span> List of subtasks</div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Raw Creation Input Box & Run Button */}
        <div className="lg:col-span-7 space-y-4">
          <div className="rounded-2xl border border-[#1b2233] bg-[#0c1018] p-5 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-white flex items-center gap-1.5">
                <ListPlus className="w-4 h-4 text-[#cda052]" /> Raw Creation Input Box
              </label>
              {rawInput && (
                <button
                  onClick={() => { setRawInput(''); setParsedStories([]); }}
                  className="text-xs text-[#7c869d] hover:text-white"
                >
                  Clear Box
                </button>
              )}
            </div>

            <textarea
              value={rawInput}
              onChange={(e) => setRawInput(e.target.value)}
              rows={14}
              placeholder={`Paste your AI-generated YAML or JSON here...\n\nExample:\n- user_story: "Validate 4-way stretch fabric GSM"\n  priority: "P1"\n  assignee: "Unassigned"\n  sprint: "Sprint 1"\n  manufacture: "Techno Sportswear"\n  styles: "All Styles"\n  description: "..."\n  acceptance_criteria: "..."\n  tasks:\n    - title: "Measure swatch weight"\n      priority: "P1"`}
              className="w-full p-4 rounded-xl bg-[#07090e] border border-[#20293d] text-xs font-mono text-white placeholder:text-[#424f67] focus:outline-none focus:border-[#cda052]/60 leading-relaxed resize-y"
            />

            <div className="flex items-center justify-between pt-1">
              <span className="text-[11px] text-[#64748b]">
                {rawInput.trim() ? `${rawInput.split('\n').length} lines pasted` : 'Ready to paste'}
              </span>

              <button
                onClick={handleParse}
                disabled={!rawInput.trim()}
                title="Run parser on raw box"
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#cda052] to-[#a97f38] text-black text-xs font-bold hover:shadow-glow transition-all disabled:opacity-50"
              >
                <Play className="w-4 h-4 fill-black" /> Run & Validate
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Parse Errors */}
      {parseErrors.length > 0 && (
        <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-800/60 text-xs text-rose-300 space-y-1">
          {parseErrors.map((err, idx) => (
            <p key={idx} className="flex items-center gap-2">
              <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" /> {err}
            </p>
          ))}
        </div>
      )}

      {/* Parsed Preview Section */}
      {parsedStories.length > 0 && (
        <div className="rounded-2xl border border-[#1f2638] bg-[#0c1018] p-5 sm:p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#181f2f] pb-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <h3 className="text-sm sm:text-base font-bold text-white">Parsed Preview & Validation</h3>
              </div>
              <p className="text-xs text-[#94a3b8] mt-0.5">
                Ready to create {parsedStories.length} User Stor{parsedStories.length === 1 ? 'y' : 'ies'} and{' '}
                {parsedStories.reduce((acc, s) => acc + s.tasks.length, 0)} linked sub-tasks.
              </p>
            </div>

            <button
              onClick={handleCreateAll}
              disabled={isSubmitting}
              className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-[#cda052] to-[#a97f38] text-black text-sm font-bold hover:shadow-glow transition-all disabled:opacity-60 flex-shrink-0"
            >
              <CheckCircle2 className="w-4 h-4" /> {isSubmitting ? 'Creating Items...' : 'Create All Work Items'}
            </button>
          </div>

          <div className="space-y-4">
            {parsedStories.map((story, idx) => (
              <div key={idx} className="p-4 rounded-xl border border-[#1c2436] bg-[#07090e] space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`text-[10px] px-2 py-0.5 rounded border font-semibold ${TYPE_COLOR[story.type]}`}>
                      {story.type}
                    </span>
                    <span className={`text-[10px] px-2 py-0.5 rounded border font-medium ${PRIORITY_BADGE_COLOR[story.priority]}`}>
                      {PRIORITY_LABEL[story.priority]}
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-[#131b2c] border border-[#202d48] text-[#cda052] font-semibold flex items-center gap-1">
                      <User className="w-2.5 h-2.5" /> {story.assignee}
                    </span>
                    {story.sprintName && (
                      <span className="text-[10px] px-2 py-0.5 rounded bg-[#101522] border border-[#1d273a] text-[#cbd5e1] flex items-center gap-1">
                        <Calendar className="w-2.5 h-2.5 text-[#cda052]" /> {story.sprintName}
                      </span>
                    )}
                    {story.vendorName && (
                      <span className="text-[10px] px-2 py-0.5 rounded bg-[#151a14] border border-[#263b22] text-amber-300 flex items-center gap-1">
                        <Factory className="w-2.5 h-2.5 text-amber-400" /> {story.vendorName}
                      </span>
                    )}
                    {story.styleIds?.includes('all') ? (
                      <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-950/70 border border-emerald-800/50 text-emerald-300 font-semibold flex items-center gap-1">
                        <Shirt className="w-2.5 h-2.5" /> All Styles (Drop 1)
                      </span>
                    ) : story.stylesText ? (
                      <span className="text-[10px] px-2 py-0.5 rounded bg-[#131724] border border-[#232b40] text-[#cbd5e1]">
                        {story.stylesText}
                      </span>
                    ) : null}
                  </div>

                  <span className="text-xs font-mono text-[#94a3b8] flex-shrink-0">
                    {story.points} pt{story.points === 1 ? '' : 's'} · {story.tasks.length} task{story.tasks.length === 1 ? '' : 's'}
                  </span>
                </div>

                <h4 className="text-sm font-bold text-white">{story.title}</h4>

                {story.description && (
                  <p className="text-xs text-[#cbd5e1] leading-relaxed whitespace-pre-wrap">{story.description}</p>
                )}

                {story.acceptanceCriteria && (
                  <div className="p-2.5 rounded-lg border border-emerald-900/30 bg-emerald-950/10 text-xs text-emerald-300/90">
                    <strong className="text-emerald-400 block mb-0.5">Acceptance Criteria:</strong>
                    <span className="whitespace-pre-wrap">{story.acceptanceCriteria}</span>
                  </div>
                )}

                {/* Subtasks inside preview */}
                {story.tasks.length > 0 && (
                  <div className="pt-2 border-t border-[#161c28] space-y-1.5">
                    <span className="text-[11px] font-semibold text-[#64748b] uppercase tracking-wider block">
                      Sub-tasks to create:
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {story.tasks.map((task, tIdx) => (
                        <div
                          key={tIdx}
                          className="flex items-center justify-between p-2 rounded-lg bg-[#0c1018] border border-[#192235] text-xs"
                        >
                          <span className="text-[#cbd5e1] font-medium truncate flex-1 mr-2">↳ {task.title}</span>
                          <span className="text-[10px] font-mono text-[#7c869d] flex-shrink-0">
                            {task.assignee} · {task.points} pt{task.points === 1 ? '' : 's'}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
