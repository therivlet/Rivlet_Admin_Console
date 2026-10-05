'use client';

import React, { useState, useMemo } from 'react';
import {
  Sparkles,
  Play,
  Copy,
  Check,
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
  X,
  FileText,
  ChevronDown,
  ChevronUp,
  Printer,
} from 'lucide-react';
import { useAdminStore } from '@/lib/store';
import { WorkItem, WorkItemPriority, WorkItemType } from '@/lib/types';
import { TYPE_COLOR, STATE_COLOR, PRIORITY_BADGE_COLOR, PRIORITY_LABEL } from '@/components/work/WorkItemModal';
import ModalPortal from '@/components/ui/ModalPortal';
import { notify } from '@/lib/notificationContext';

const SAMPLE_YAML = `
- user_story: "Finalize proto sample fit & sizing specs for Drop 1 Leggings"
  story_type: "User Story"
  priority: "P1"
  points: 5
  assignee: "Unassigned"
  sprint: "Sprint 1"
  manufacture: "Layo Group"
  styles: "Leggings, Sports Bra"
  description: "Lead fit sessions with sample master. Verify waistband elasticity, high-rise seam placement, and 4-way squat-proof density under 240 GSM."
  acceptance_criteria: "Fit trial approved across XS, S, and M. Zero roll-down on waistband during movement testing."
  tasks:
    - title: "Audit proto sample waist tension & stretch recovery"
      priority: "P1"
      points: 2
      assignee: "Unassigned"
      description: "Perform tensile testing across 25 cycles on Drop 1 waistbands to evaluate elastic retention."
      acceptance_criteria: "Elastic recovery >= 95% with zero elastane breakdown or sagging."
    - title: "Log POM measurement delta between tech-pack spec and physical sample"
      priority: "P2"
      points: 1
      assignee: "Unassigned"
      description: "Audit physical garment points of measure against tech-pack graded spec sheets."
      acceptance_criteria: "All 18 points of measure within +/- 0.5 cm tolerance margin."
    - title: "Request second proto adjustment for leg hem flatlock seams"
      priority: "P2"
      points: 1
      assignee: "Unassigned"
      description: "Issue revision note to Layo Group for flatlock seam stitch tension."
      acceptance_criteria: "Revised proto sample ticket acknowledged by factory QA."

- user_story: "Lab Dip Colorfastness & D65 Lighting Booth Verification"
  story_type: "User Story"
  priority: "P2"
  points: 3
  assignee: "Unassigned"
  sprint: "Sprint 1"
  manufacture: "Layo Group"
  styles: "All Styles"
  description: "Inspect and sign off on fabric lab dips in Midnight and Cardamom colorways for all 6 launch styles."
  acceptance_criteria: "Delta-E color difference is under 0.8 compared to Pantone TCX standard swatch. Washing colorfastness grade 4.5+."
  tasks:
    - title: "Review color swatches under D65, TL84, and daylight lamps"
      priority: "P1"
      points: 1
      assignee: "Unassigned"
      description: "Examine lab dips under standardized light booth conditions."
      acceptance_criteria: "Zero visible metamerism under multi-light comparison."
    - title: "Send signed swatch physical approvals back to factory"
      priority: "P2"
      points: 1
      assignee: "Unassigned"
      description: "Courier physically counter-signed master colorway cards to production team."
      acceptance_criteria: "Waybill tracking ID logged and received by factory coordinator."
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
      manufacture: 'Layo Group',
      styles: 'Leggings, Sports Bra',
      description: 'Lead fit sessions with sample master. Verify waistband elasticity, high-rise seam placement, and 4-way squat-proof density under 240 GSM.',
      acceptance_criteria: 'Fit trial approved across XS, S, and M. Zero roll-down on waistband during movement testing.',
      tasks: [
        {
          title: 'Audit proto sample waist tension & stretch recovery',
          priority: 'P1',
          points: 2,
          assignee: 'Unassigned',
          description: 'Perform tensile testing across 25 cycles on Drop 1 waistbands to evaluate elastic retention.',
          acceptance_criteria: 'Elastic recovery >= 95% with zero elastane breakdown or sagging.',
        },
        {
          title: 'Log POM measurement delta between tech-pack spec and physical sample',
          priority: 'P2',
          points: 1,
          assignee: 'Unassigned',
          description: 'Audit physical garment points of measure against tech-pack graded spec sheets.',
          acceptance_criteria: 'All 18 points of measure within +/- 0.5 cm tolerance margin.',
        },
        {
          title: 'Request second proto adjustment for leg hem flatlock seams',
          priority: 'P2',
          points: 1,
          assignee: 'Unassigned',
          description: 'Issue revision note to Layo Group for flatlock seam stitch tension.',
          acceptance_criteria: 'Revised proto sample ticket acknowledged by factory QA.',
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
  acceptanceCriteria?: string;
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
  const { workItems, sprints, vendors, pipelineItems, saveWorkItemsBulk } = useAdminStore();

  const [rawInput, setRawInput] = useState('');
  const [formatMode, setFormatMode] = useState<'yaml' | 'json'>('json');
  const [copiedPrompt, setCopiedPrompt] = useState(false);
  const [copiedTemplate, setCopiedTemplate] = useState(false);
  const [parsedStories, setParsedStories] = useState<ParsedStory[]>([]);
  const [parseErrors, setParseErrors] = useState<string[]>([]);
  const [isCreatedSuccess, setIsCreatedSuccess] = useState(false);
  const [createdSummary, setCreatedSummary] = useState<{ stories: number; tasks: number } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Consolidation Modal States
  const [showConsolidateModal, setShowConsolidateModal] = useState(false);
  const [includeExistingWorkload, setIncludeExistingWorkload] = useState(true);
  const [outputFormat, setOutputFormat] = useState<'prompt' | 'json'>('prompt');
  const [copiedUnified, setCopiedUnified] = useState(false);
  const [showPreviewText, setShowPreviewText] = useState(false);

  // Determine current active sprint
  const activeSprint = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    const current = sprints.find((s) => s.startDate <= today && s.endDate >= today);
    if (current) return current;
    const upcoming = [...sprints].sort((a, b) => a.startDate.localeCompare(b.startDate)).find((s) => s.startDate > today);
    if (upcoming) return upcoming;
    return [...sprints].sort((a, b) => b.endDate.localeCompare(a.endDate))[0] || sprints[0];
  }, [sprints]);

  const [selectedConsolidateSprintId, setSelectedConsolidateSprintId] = useState<string>('active');

  const resolvedConsolidateSprint = useMemo(() => {
    if (selectedConsolidateSprintId === 'all') return null;
    if (selectedConsolidateSprintId === 'active') return activeSprint;
    return sprints.find((s) => s.id === selectedConsolidateSprintId) || activeSprint;
  }, [selectedConsolidateSprintId, activeSprint, sprints]);

  // Consolidated items for the selected sprint
  const consolidatedStories = useMemo(() => {
    return workItems.filter((w) => {
      const matchesSprint = !resolvedConsolidateSprint || w.sprintId === resolvedConsolidateSprint.id;
      return matchesSprint && (w.type === 'User Story' || w.type === 'Bug' || w.type === 'Feature' || w.type === 'Epic');
    });
  }, [workItems, resolvedConsolidateSprint]);

  const consolidatedTasks = useMemo(() => {
    return workItems.filter((w) => {
      const matchesSprint = !resolvedConsolidateSprint || w.sprintId === resolvedConsolidateSprint.id;
      return matchesSprint && w.type === 'Task';
    });
  }, [workItems, resolvedConsolidateSprint]);

  // Sprint Progress stats
  const sprintStats = useMemo(() => {
    const allSprintItems = workItems.filter((w) => !resolvedConsolidateSprint || w.sprintId === resolvedConsolidateSprint.id);
    const totalPoints = allSprintItems.reduce((acc, i) => acc + (i.storyPoints || 0), 0);
    const donePoints = allSprintItems
      .filter((i) => i.state === 'Closed' || i.state === 'Resolved')
      .reduce((acc, i) => acc + (i.storyPoints || 0), 0);
    const inProgressPoints = allSprintItems
      .filter((i) => i.state === 'Active' || i.state === 'In Review')
      .reduce((acc, i) => acc + (i.storyPoints || 0), 0);
    const doneCount = allSprintItems.filter((i) => i.state === 'Closed' || i.state === 'Resolved').length;
    const progressPercent = totalPoints > 0 ? Math.round((donePoints / totalPoints) * 100) : (allSprintItems.length > 0 ? Math.round((doneCount / allSprintItems.length) * 100) : 0);

    return {
      totalItems: allSprintItems.length,
      totalStories: consolidatedStories.length,
      totalTasks: consolidatedTasks.length,
      totalPoints,
      donePoints,
      inProgressPoints,
      progressPercent,
    };
  }, [workItems, resolvedConsolidateSprint, consolidatedStories, consolidatedTasks]);

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

  // Helper to match vendor (defaults Layo Group if not found)
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

  // Strip markdown code fences if present
  const extractPayload = (raw: string): string => {
    let text = raw.trim();
    const fenceMatch = text.match(/```(?:json|yaml|yml)?\s*([\s\S]*?)```/i);
    if (fenceMatch && fenceMatch[1]?.trim()) {
      return fenceMatch[1].trim();
    }
    text = text.replace(/^```[a-z]*\s*/i, '').replace(/\s*```$/, '').trim();
    return text;
  };

  // Smart Parser that handles JSON, YAML-like block format, and key-value entries
  const handleParse = () => {
    setParseErrors([]);
    setIsCreatedSuccess(false);

    const input = extractPayload(rawInput);
    if (!input) {
      setParseErrors(['Please enter or paste data into the raw creation input box before running.']);
      return;
    }

    // Try parsing as JSON first
    let isJson = false;
    let jsonTarget = input;
    if (input.startsWith('[') || input.startsWith('{')) {
      isJson = true;
    } else {
      const arrayMatch = input.match(/\[\s*\{[\s\S]*\}\s*\]/);
      if (arrayMatch) {
        jsonTarget = arrayMatch[0];
        isJson = true;
      } else {
        const objMatch = input.match(/\{\s*"[\s\S]*"\s*:\s*[\s\S]*\}/);
        if (objMatch) {
          jsonTarget = objMatch[0];
          isJson = true;
        }
      }
    }

    if (isJson) {
      try {
        const sanitizedJson = jsonTarget
          .replace(/\/\/.*$/gm, '')
          .replace(/\/\*[\s\S]*?\*\//g, '')
          .replace(/,\s*([\]}])/g, '$1');

        const parsed = JSON.parse(sanitizedJson);
        let list: any[] = [];
        if (Array.isArray(parsed)) {
          list = parsed;
        } else if (parsed && typeof parsed === 'object') {
          list =
            parsed.stories ||
            parsed.user_stories ||
            parsed.userStories ||
            parsed.items ||
            parsed.work_items ||
            parsed.workItems ||
            parsed.data ||
            [parsed];
        }

        const stories: ParsedStory[] = [];

        for (const item of list) {
          const title = item.user_story || item.title || item.story || item.name || item.story_title;
          if (!title) continue;

          const rawTasks = Array.isArray(item.tasks)
            ? item.tasks
            : Array.isArray(item.subtasks)
            ? item.subtasks
            : Array.isArray(item.child_tasks)
            ? item.child_tasks
            : [];

          const tasks: ParsedTask[] = rawTasks.map((t: any) => ({
            title: String(t.title || t.name || t.task || t.action || 'Task').trim(),
            priority: resolvePriority(t.priority),
            points: t.points !== undefined ? Number(t.points) : (t.story_points !== undefined ? Number(t.story_points) : 1),
            assignee: t.assignee || item.assignee || 'Unassigned',
            description: t.description || t.desc || '',
            acceptanceCriteria: t.acceptance_criteria || t.acceptanceCriteria || t.criteria || '',
          }));

          stories.push({
            title: String(title).trim(),
            type: (item.story_type || item.type || 'User Story') as WorkItemType,
            priority: resolvePriority(item.priority),
            points: item.points ? Number(item.points) : (item.story_points ? Number(item.story_points) : 3),
            assignee: item.assignee || 'Unassigned',
            sprintName: item.sprint || item.sprints,
            sprintId: resolveSprintId(item.sprint || item.sprints),
            vendorName: item.manufacture || item.manufacturer || item.vendor || 'Layo Group',
            vendorId: resolveVendorId(item.manufacture || item.manufacturer || item.vendor || 'Layo Group'),
            stylesText: item.styles || item.style || (Array.isArray(item.styles) ? item.styles.join(', ') : undefined),
            styleIds: resolveStyleIds(Array.isArray(item.styles) ? item.styles.join(', ') : item.styles),
            operationCategory: item.operation || item.operation_category || 'Operations & Sourcing',
            description: item.description || item.desc || '',
            acceptanceCriteria: item.acceptance_criteria || item.acceptanceCriteria || '',
            tasks,
          });
        }

        if (stories.length === 0) {
          setParseErrors(['Could not detect valid user stories in the JSON input. Please verify the structure.']);
        } else {
          setParsedStories(stories);
          return;
        }
      } catch (e: any) {
        // Fall back to YAML / line parser if JSON parse fails
      }
    }

    // YAML / Structured Line Parser
    try {
      const lines = input.split('\n');
      const stories: ParsedStory[] = [];
      let currentStory: Partial<ParsedStory> | null = null;
      let currentTask: Partial<ParsedTask> | null = null;
      let insideTasks = false;
      let multilineField: 'story_desc' | 'story_ac' | 'task_desc' | 'task_ac' | null = null;

      for (let i = 0; i < lines.length; i++) {
        const rawLine = lines[i];
        const line = rawLine.trim();

        if (!line || line.startsWith('#')) continue;

        // Check if starting a new story
        const isStoryStarter =
          line.startsWith('- user_story:') ||
          line.startsWith('- story:') ||
          line.startsWith('user_story:') ||
          line.startsWith('Story:') ||
          line.startsWith('User Story:') ||
          (!insideTasks && line.startsWith('- title:'));

        if (isStoryStarter) {
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
          multilineField = null;

          const colonIdx = line.indexOf(':');
          const titleVal = colonIdx >= 0 ? line.slice(colonIdx + 1).replace(/^[\s"']+|[\s"']+$/g, '') : line.replace(/^-\s*/, '');

          currentStory = {
            title: titleVal,
            type: 'User Story',
            priority: 2,
            points: 3,
            assignee: 'Unassigned',
            tasks: [],
          };
          continue;
        }

        if (!currentStory) {
          currentStory = {
            title: line.replace(/^[-*#\s]+/, '').replace(/^title:\s*/i, ''),
            type: 'User Story',
            priority: 2,
            points: 3,
            assignee: 'Unassigned',
            tasks: [],
          };
          continue;
        }

        // Inside tasks section declaration
        if (line.toLowerCase().startsWith('tasks:') || line.toLowerCase().startsWith('subtasks:')) {
          insideTasks = true;
          multilineField = null;
          continue;
        }

        if (insideTasks) {
          // Task entry indicator
          if (line.startsWith('- title:') || line.startsWith('- task:') || line.startsWith('- name:') || (line.startsWith('- ') && !line.includes(':'))) {
            if (currentTask && currentTask.title) {
              currentStory.tasks = currentStory.tasks || [];
              currentStory.tasks.push(currentTask as ParsedTask);
            }
            multilineField = null;
            const colonIdx = line.indexOf(':');
            const content = colonIdx >= 0
              ? line.slice(colonIdx + 1).replace(/^[\s"']+|[\s"']+$/g, '')
              : line.replace(/^-\s*/, '').replace(/^["']|["']$/g, '');

            currentTask = {
              title: content,
              priority: 2,
              points: 1,
              assignee: currentStory.assignee || 'Unassigned',
              description: '',
              acceptanceCriteria: '',
            };
            continue;
          }

          if (currentTask) {
            const colonIdx = line.indexOf(':');
            if (colonIdx > 0) {
              const key = line.slice(0, colonIdx).trim().toLowerCase().replace(/^[-_\s]+/, '');
              const val = line.slice(colonIdx + 1).replace(/^[\s"']+|[\s"']+$/g, '');

              if (key.includes('priority')) {
                currentTask.priority = resolvePriority(val);
                multilineField = null;
              } else if (key.includes('point')) {
                currentTask.points = Number(val) || 1;
                multilineField = null;
              } else if (key.includes('assignee')) {
                currentTask.assignee = val.toLowerCase() === 'unassigned' ? 'Unassigned' : val;
                multilineField = null;
              } else if (key === 'description' || key === 'desc') {
                currentTask.description = val;
                multilineField = 'task_desc';
              } else if (key.includes('acceptance') || key === 'criteria') {
                currentTask.acceptanceCriteria = val;
                multilineField = 'task_ac';
              }
              continue;
            } else if (multilineField) {
              if (multilineField === 'task_desc') {
                currentTask.description = ((currentTask.description || '') + ' ' + line).trim();
              } else if (multilineField === 'task_ac') {
                currentTask.acceptanceCriteria = ((currentTask.acceptanceCriteria || '') + ' ' + line).trim();
              }
              continue;
            }
          }
        }

        // Story Attributes
        const colonIdx = line.indexOf(':');
        if (colonIdx > 0 && !insideTasks) {
          const key = line.slice(0, colonIdx).trim().toLowerCase().replace(/^[-_\s]+/, '');
          const val = line.slice(colonIdx + 1).replace(/^[\s"']+|[\s"']+$/g, '');

          if (key === 'user_story' || key === 'story' || key === 'title') {
            currentStory.title = val;
            multilineField = null;
          } else if (key === 'story_type' || key === 'type') {
            currentStory.type = val as WorkItemType;
            multilineField = null;
          } else if (key === 'priority') {
            currentStory.priority = resolvePriority(val);
            multilineField = null;
          } else if (key === 'points' || key === 'story_points' || key === 'new priority points') {
            currentStory.points = Number(val) || 3;
            multilineField = null;
          } else if (key === 'assignee' || key === 'assigned or unassigned') {
            currentStory.assignee = val.toLowerCase() === 'unassigned' ? 'Unassigned' : val;
            multilineField = null;
          } else if (key === 'sprint' || key === 'sprints') {
            currentStory.sprintName = val;
            currentStory.sprintId = resolveSprintId(val);
            multilineField = null;
          } else if (key === 'manufacture' || key === 'manufacturer' || key === 'vendor') {
            currentStory.vendorName = val;
            currentStory.vendorId = resolveVendorId(val);
            multilineField = null;
          } else if (key === 'styles' || key === 'style' || key === 'products') {
            currentStory.stylesText = val;
            currentStory.styleIds = resolveStyleIds(val);
            multilineField = null;
          } else if (key === 'operation' || key === 'operation_category') {
            currentStory.operationCategory = val;
            multilineField = null;
          } else if (key === 'description' || key === 'desc') {
            currentStory.description = val;
            multilineField = 'story_desc';
          } else if (key === 'acceptance_criteria' || key === 'acceptance criteria' || key === 'criteria') {
            currentStory.acceptanceCriteria = val;
            multilineField = 'story_ac';
          }
          continue;
        } else if (multilineField && !insideTasks) {
          if (multilineField === 'story_desc' && currentStory) {
            currentStory.description = ((currentStory.description || '') + ' ' + line).trim();
          } else if (multilineField === 'story_ac' && currentStory) {
            currentStory.acceptanceCriteria = ((currentStory.acceptanceCriteria || '') + ' ' + line).trim();
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
          'Could not parse any User Stories from the provided text. Please ensure lines start with "- user_story: ..." or format as JSON array.',
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
            text: `Imported via Sprint Bulk Creation module on ${new Date().toLocaleDateString()}.`,
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
            acceptanceCriteria: t.acceptanceCriteria || '',
            state: 'New',
            priority: t.priority || 2,
            order: j + 1,
            taskNumber: j + 1,
            storyPoints: t.points || 1,
            parentId: storyId, // Linked to parent story
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

  // Copy AI Prompt with explicit Task Description & Acceptance Criteria
  const handleCopyPrompt = () => {
    const promptText = `
Please generate apparel production / sprint work tracking user stories and child tasks for the Rivlet apparel brand in structured JSON (or YAML) format. Leave "assignee" as "Unassigned" unless specifically assigned.

CRITICAL FORMAT REQUIREMENT:
Every User Story AND every child Task MUST include both "description" and "acceptance_criteria".

JSON Schema:
[
  {
    "user_story": "[Title of user story or feature]",
    "story_type": "User Story",
    "priority": "P1", // P1 (Critical), P2 (High), P3 (Medium), P4 (Low)
    "points": 5, // 1, 2, 3, 5, 8
    "assignee": "Unassigned",
    "sprint": "Sprint 1",
    "manufacture": "Layo Group", // Default partner: Layo Group (or Unassigned)
    "styles": "All Styles", // Or specific styles: e.g. "Leggings, Sports Bra"
    "operation": "Operations & Sourcing",
    "description": "[Detailed operational description of user story requirements without length limits]",
    "acceptance_criteria": "[Clear checklist / verifiable criteria for story sign-off]",
    "tasks": [
      {
        "title": "[Subtask 1 action title]",
        "priority": "P1",
        "points": 2,
        "assignee": "Unassigned",
        "description": "[Detailed technical or operational instructions for this specific subtask]",
        "acceptance_criteria": "[Verifiable criteria for task completion and sign-off]"
      },
      {
        "title": "[Subtask 2 action title]",
        "priority": "P2",
        "points": 1,
        "assignee": "Unassigned",
        "description": "[Detailed instructions for executing this task]",
        "acceptance_criteria": "[Verifiable criteria for sign-off]"
      }
    ]
  }
]
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

  // Generate Consolidated Content based on Selection Window (Include Workload + Output Format)
  const generateConsolidatedContent = () => {
    const sprintName = resolvedConsolidateSprint ? resolvedConsolidateSprint.name : 'All Active Work Tracking';
    const sprintGoal = resolvedConsolidateSprint?.goal || 'Drive drop execution, vendor alignment, and production milestones.';
    const sprintDates = resolvedConsolidateSprint ? `${resolvedConsolidateSprint.startDate} to ${resolvedConsolidateSprint.endDate}` : 'Ongoing';

    if (outputFormat === 'json') {
      if (includeExistingWorkload) {
        const payload = {
          sprint_context: {
            sprint: sprintName,
            dates: sprintDates,
            goal: sprintGoal,
            progress_percent: sprintStats.progressPercent,
            points_completed: sprintStats.donePoints,
            total_points: sprintStats.totalPoints,
            status_guide: {
              completed: "Tasks with state 'Closed' or 'Resolved' have fulfilled acceptance criteria.",
              in_progress: "Tasks with state 'Active' or 'In Review' are NOT completed. Their acceptance criteria are pending fulfillment.",
              new_pending: "Tasks with state 'New' are unstarted. Their acceptance criteria have not started."
            }
          },
          existing_sprint_workload: consolidatedStories.map((story) => {
            const childTasks = consolidatedTasks.filter((t) => t.parentId === story.id);
            return {
              user_story: story.title,
              story_type: story.type,
              execution_state: story.state,
              is_completed: story.state === 'Closed' || story.state === 'Resolved',
              priority: `P${story.priority}`,
              story_points: story.storyPoints || 0,
              assignee: story.assignee || 'Unassigned',
              sprint: resolvedConsolidateSprint?.name || sprintName,
              manufacture: 'Layo Group',
              operation: story.operationCategory,
              description: story.description || '',
              acceptance_criteria: story.acceptanceCriteria || '',
              acceptance_criteria_fulfilled: story.state === 'Closed' || story.state === 'Resolved',
              tasks: childTasks.map((t) => {
                const isTaskDone = t.state === 'Closed' || t.state === 'Resolved';
                const isTaskActive = t.state === 'Active' || t.state === 'In Review';
                return {
                  title: t.title,
                  execution_state: t.state,
                  is_completed: isTaskDone,
                  status_note: isTaskDone ? 'COMPLETED (Requirements verified)' : (isTaskActive ? 'IN PROGRESS (Pending fulfillment - NOT done)' : 'NEW (Not started yet)'),
                  priority: `P${t.priority}`,
                  points: t.storyPoints || 1,
                  assignee: t.assignee || 'Unassigned',
                  description: t.description || '',
                  acceptance_criteria: t.acceptanceCriteria || '',
                  acceptance_criteria_fulfilled: isTaskDone,
                };
              }),
            };
          }),
          target_delivery_format: [
            {
              user_story: "New User Story Title",
              story_type: "User Story",
              priority: "P1",
              points: 3,
              assignee: "Unassigned",
              sprint: sprintName,
              manufacture: "Layo Group",
              styles: "All Styles",
              operation: "Operations & Sourcing",
              description: "Detailed operational requirements...",
              acceptance_criteria: "Verifiable checklist of criteria for story sign-off...",
              tasks: [
                {
                  title: "Specific child task action",
                  priority: "P1",
                  points: 1,
                  assignee: "Unassigned",
                  description: "Detailed technical instructions for executing this task...",
                  acceptance_criteria: "Conditions required for task sign-off..."
                }
              ]
            }
          ]
        };
        return JSON.stringify(payload, null, 2);
      } else {
        // Pure target JSON schema template alone
        const template = [
          {
            user_story: "Finalize proto sample fit & sizing specs for Drop 1 Leggings",
            story_type: "User Story",
            priority: "P1",
            points: 5,
            assignee: "Unassigned",
            sprint: sprintName,
            manufacture: "Layo Group",
            styles: "Leggings, Sports Bra",
            operation: "Operations & Sourcing",
            description: "Lead fit sessions with sample master. Verify waistband elasticity and high-rise seam placement.",
            acceptance_criteria: "Fit trial approved across XS, S, and M. Zero roll-down on waistband during movement testing.",
            tasks: [
              {
                title: "Audit proto sample waist tension & stretch recovery",
                priority: "P1",
                points: 2,
                assignee: "Unassigned",
                description: "Perform tensile testing across 25 cycles on Drop 1 waistbands to evaluate elastic retention.",
                acceptance_criteria: "Elastic recovery >= 95% with zero elastane breakdown or sagging."
              },
              {
                title: "Log POM measurement delta between tech-pack spec and physical sample",
                priority: "P2",
                points: 1,
                assignee: "Unassigned",
                description: "Audit physical garment points of measure against tech-pack graded spec sheets.",
                acceptance_criteria: "All 18 points of measure within +/- 0.5 cm tolerance margin."
              }
            ]
          }
        ];
        return JSON.stringify(template, null, 2);
      }
    }

    // Markdown AI Planning Prompt Format
    let prompt = `# RIVLET SPRINT PLANNING & WORKLOAD PROMPT FOR AI\n\n`;
    prompt += `**Target Sprint**: ${sprintName} (${sprintDates})\n`;
    prompt += `**Sprint Goal**: ${sprintGoal}\n`;
    prompt += `**Default Manufacturer**: Layo Group\n\n`;

    if (includeExistingWorkload) {
      prompt += `**Sprint Progress**: ${sprintStats.progressPercent}% completed (${sprintStats.donePoints} of ${sprintStats.totalPoints} points closed/resolved)\n`;
      prompt += `**Existing Workload**: ${consolidatedStories.length} User Stories, ${consolidatedTasks.length} Child Tasks\n\n`;
      prompt += `================================================================================\n`;
      prompt += `CRITICAL INSTRUCTION ON STATUSES & ACCEPTANCE CRITERIA:\n`;
      prompt += `1. Only tasks marked as [COMPLETED (Resolved/Closed)] have their acceptance criteria met.\n`;
      prompt += `2. Tasks marked as [IN PROGRESS (Active/In Review)] or [NEW (Pending/Not Started)] are NOT DONE. Their acceptance criteria are pending fulfillment and STILL NEED TO BE DELIVERED.\n`;
      prompt += `3. When generating new stories or tasks, take into account what is already finished vs what is still active or pending, and avoid duplicating in-flight tasks.\n`;
      prompt += `================================================================================\n\n`;
      prompt += `## CURRENT SPRINT WORKLOAD BREAKDOWN\n\n`;

      if (consolidatedStories.length === 0) {
        prompt += `No stories currently scheduled in this sprint.\n\n`;
      } else {
        consolidatedStories.forEach((story, idx) => {
          const childTasks = consolidatedTasks.filter((t) => t.parentId === story.id);
          const isStoryClosed = story.state === 'Closed' || story.state === 'Resolved';
          const isStoryActive = story.state === 'Active' || story.state === 'In Review';
          const storyStatusLabel = isStoryClosed
            ? 'COMPLETED (Resolved/Closed)'
            : isStoryActive
            ? 'IN PROGRESS (Active - Under execution)'
            : 'NEW (Pending - Not started)';

          prompt += `### STORY ${idx + 1}: ${story.title}\n`;
          prompt += `- **Execution Status**: ${storyStatusLabel}\n`;
          prompt += `- **Type**: ${story.type} | **Priority**: P${story.priority} | **Points**: ${story.storyPoints || 0} pts | **Assignee**: ${story.assignee || 'Unassigned'}\n`;
          prompt += `- **Manufacturer**: Layo Group\n`;
          if (story.operationCategory) prompt += `- **Operation**: ${story.operationCategory}\n`;
          prompt += `- **Description**:\n  ${story.description || 'No description provided.'}\n`;
          prompt += `- **Acceptance Criteria**:\n  ${story.acceptanceCriteria || 'No acceptance criteria defined.'}\n`;

          if (childTasks.length > 0) {
            prompt += `- **Child Tasks (${childTasks.length})**:\n`;
            childTasks.forEach((task, tIdx) => {
              const isTaskDone = task.state === 'Closed' || task.state === 'Resolved';
              const isTaskActive = task.state === 'Active' || task.state === 'In Review';
              const taskStatusText = isTaskDone
                ? 'COMPLETED (Resolved/Closed)'
                : isTaskActive
                ? 'IN PROGRESS (Active - NOT COMPLETED)'
                : 'NEW (Pending / Not Started)';

              const criteriaStatusText = isTaskDone
                ? `[CRITERIA MET & VERIFIED]: ${task.acceptanceCriteria}`
                : isTaskActive
                ? `[PENDING FULFILLMENT - NOT DONE]: ${task.acceptanceCriteria}`
                : `[REQUIRED FOR FUTURE SIGN-OFF - NOT STARTED]: ${task.acceptanceCriteria}`;

              prompt += `  * Task ${idx + 1}.${tIdx + 1}: ${task.title}\n`;
              prompt += `    - Status: ${taskStatusText} | Priority: P${task.priority} | Points: ${task.storyPoints || 1} pt | Assignee: ${task.assignee || 'Unassigned'}\n`;
              if (task.description) {
                prompt += `    - Description: ${task.description}\n`;
              }
              if (task.acceptanceCriteria) {
                prompt += `    - Acceptance Criteria: ${criteriaStatusText}\n`;
              }
            });
          }
          prompt += `\n`;
        });
      }

      // Unparented tasks
      const unparentedTasks = consolidatedTasks.filter(
        (t) => !t.parentId || !consolidatedStories.some((s) => s.id === t.parentId)
      );
      if (unparentedTasks.length > 0) {
        prompt += `### STANDALONE / UNPARENTED TASKS:\n`;
        unparentedTasks.forEach((task, idx) => {
          const isTaskDone = task.state === 'Closed' || task.state === 'Resolved';
          const taskStatusText = isTaskDone ? 'COMPLETED' : 'IN PROGRESS / PENDING';
          prompt += `* Task ${idx + 1}: ${task.title} (Status: ${taskStatusText} | State: ${task.state} | Priority: P${task.priority} | Points: ${task.storyPoints || 1})\n`;
          if (task.description) prompt += `  - Description: ${task.description}\n`;
          if (task.acceptanceCriteria) {
            prompt += `  - Acceptance Criteria: ${isTaskDone ? '[VERIFIED]:' : '[PENDING]:'} ${task.acceptanceCriteria}\n`;
          }
        });
        prompt += `\n`;
      }
    }

    prompt += `================================================================================\n`;
    prompt += `## AI INSTRUCTION FOR PLANNING THE NEXT STORIES & TASKS\n`;
    prompt += `================================================================================\n`;
    prompt += `You are the Lead Technical Production Manager & Agile Delivery Lead for Rivlet, an athletic apparel brand.\n`;
    if (includeExistingWorkload) {
      prompt += `Carefully review the existing stories, completed progress, in-flight work, and remaining scope above.\n`;
      prompt += `1. Identify remaining deliverables, missing verification steps, and next sequential milestones.\n`;
      prompt += `2. Suggest and generate the next wave of User Stories and child Tasks needed to advance the brand.\n`;
    } else {
      prompt += `Plan and generate the necessary User Stories and child Tasks for this sprint cadence.\n`;
    }
    prompt += `3. Every User Story AND every child Task MUST include both a detailed "description" and verifiable "acceptance_criteria".\n`;
    prompt += `4. Manufacturer must be set to "Layo Group" (or "Unassigned").\n`;
    prompt += `5. Output strictly in the Rivlet Bulk Creation JSON format shown below:\n\n`;
    prompt += `[\n`;
    prompt += `  {\n`;
    prompt += `    "user_story": "[New Story Title]",\n`;
    prompt += `    "story_type": "User Story",\n`;
    prompt += `    "priority": "P1",\n`;
    prompt += `    "points": 3,\n`;
    prompt += `    "assignee": "Unassigned",\n`;
    prompt += `    "sprint": "${sprintName}",\n`;
    prompt += `    "manufacture": "Layo Group",\n`;
    prompt += `    "styles": "All Styles",\n`;
    prompt += `    "operation": "Operations & Sourcing",\n`;
    prompt += `    "description": "Comprehensive explanation of what must be built or executed...",\n`;
    prompt += `    "acceptance_criteria": "Verifiable checklist of conditions for sign-off...",\n`;
    prompt += `    "tasks": [\n`;
    prompt += `      {\n`;
    prompt += `        "title": "[Child Task Title]",\n`;
    prompt += `        "priority": "P1",\n`;
    prompt += `        "points": 1,\n`;
    prompt += `        "assignee": "Unassigned",\n`;
    prompt += `        "description": "Step-by-step instructions for completing this task...",\n`;
    prompt += `        "acceptance_criteria": "Verifiable criteria for task sign-off..."\n`;
    prompt += `      }\n`;
    prompt += `    ]\n`;
    prompt += `  }\n`;
    prompt += `]\n`;

    return prompt;
  };

  const handleUnifiedCopy = () => {
    const text = generateConsolidatedContent();
    navigator.clipboard.writeText(text);
    setCopiedUnified(true);
    notify.success(
      'Workload Context Copied',
      includeExistingWorkload
        ? 'Full workload breakdown with acceptance criteria and target JSON schema copied to clipboard.'
        : 'Target JSON delivery schema copied to clipboard.'
    );
    setTimeout(() => setCopiedUnified(false), 2500);
  };

  const handleGenerateReport = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      notify.error('Pop-up Blocked', 'Please allow pop-ups to open the printable executive report.');
      return;
    }

    const targetSprintName =
      selectedConsolidateSprintId === 'active'
        ? activeSprint
          ? activeSprint.name
          : 'Active Sprint'
        : selectedConsolidateSprintId === 'all'
        ? 'All Sprints & Backlog'
        : sprints.find((s) => s.id === selectedConsolidateSprintId)?.name || 'Selected Sprint';

    const totalStories = consolidatedStories.length;
    const totalTasks = consolidatedTasks.length;
    const completedTasks = consolidatedTasks.filter((t) => t.state === 'Closed' || t.state === 'Resolved').length;
    const activeTasks = consolidatedTasks.filter((t) => t.state === 'Active' || t.state === 'In Review').length;
    const newTasks = consolidatedTasks.filter((t) => t.state === 'New' || !t.state).length;

    const reportDate = new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    const storiesHtml = consolidatedStories
      .map((story, sIdx) => {
        const childTasks = consolidatedTasks.filter((t) => t.parentId === story.id);
        const isDone = story.state === 'Closed' || story.state === 'Resolved';
        const isActive = story.state === 'Active' || story.state === 'In Review';
        const statusLabel = isDone ? 'FULFILLED' : isActive ? 'IN PROGRESS' : 'NOT STARTED';
        const statusClass = isDone ? 'tag-fulfilled' : isActive ? 'tag-inprogress' : 'tag-notstarted';

        const tasksRows = childTasks
          .map((t, tIdx) => {
            const isTaskDone = t.state === 'Closed' || t.state === 'Resolved';
            const isTaskActive = t.state === 'Active' || t.state === 'In Review';
            const taskTag = isTaskDone ? 'tag-fulfilled' : isTaskActive ? 'tag-inprogress' : 'tag-notstarted';
            const criteriaStatus = isTaskDone
              ? '[Fulfilled & Verified]'
              : isTaskActive
              ? '[Incomplete / In-Progress]'
              : '[Requirements - Not Started]';

            return `
              <tr>
                <td style="font-weight:600; font-family:monospace; color:#555;">Task ${sIdx + 1}.${tIdx + 1}</td>
                <td>
                  <strong>${t.title}</strong>
                  ${t.description ? `<div style="font-size:11px; color:#555; margin-top:2px;">${t.description}</div>` : ''}
                  ${
                    t.acceptanceCriteria
                      ? `<div style="font-size:10px; margin-top:4px; padding:4px 8px; background:#f9fafb; border-left:3px solid #b78938; border-radius:2px;"><strong>Acceptance Criteria ${criteriaStatus}:</strong> ${t.acceptanceCriteria}</div>`
                      : ''
                  }
                </td>
                <td style="white-space:nowrap;"><span class="badge ${taskTag}">${t.state}</span></td>
                <td style="font-size:11px; color:#555;">${t.assignee || 'Unassigned'}</td>
              </tr>
            `;
          })
          .join('');

        return `
          <div class="story-card">
            <div class="story-header">
              <div class="story-title">
                <span class="story-num">Story ${sIdx + 1}</span>
                <h3>${story.title}</h3>
              </div>
              <div style="display:flex; gap:6px; align-items:center;">
                <span class="badge ${statusClass}">${statusLabel}</span>
                <span class="badge badge-outline">${story.type || 'User Story'}</span>
                <span class="badge badge-outline">${story.storyPoints || 3} Pts</span>
              </div>
            </div>

            ${story.description ? `<div class="story-desc"><strong>Description:</strong> ${story.description}</div>` : ''}

            ${
              story.acceptanceCriteria
                ? `<div class="story-ac">
                    <strong>Acceptance Criteria:</strong>
                    <div style="margin-top:3px; white-space:pre-wrap;">${story.acceptanceCriteria}</div>
                   </div>`
                : ''
            }

            ${
              childTasks.length > 0
                ? `
                <div class="tasks-section">
                  <h4 style="font-size:11px; text-transform:uppercase; letter-spacing:0.05em; color:#777; margin:10px 0 6px 0;">Child Engineering & Sourcing Tasks (${childTasks.length}):</h4>
                  <table class="tasks-table">
                    <thead>
                      <tr>
                        <th style="width:70px;">Task #</th>
                        <th>Task Deliverable & Criteria Status</th>
                        <th style="width:110px;">Status</th>
                        <th style="width:100px;">Assignee</th>
                      </tr>
                    </thead>
                    <tbody>
                      ${tasksRows}
                    </tbody>
                  </table>
                </div>
              `
                : ''
            }
          </div>
        `;
      })
      .join('');

    const htmlContent = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <title>Rivlet - Sprint Workload Report (${targetSprintName})</title>
        <style>
          * { box-sizing: border-box; }
          body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            margin: 0;
            padding: 35px;
            color: #1a1a1a;
            background: #fff;
            line-height: 1.5;
            font-size: 13px;
          }
          .header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            border-bottom: 2px solid #b78938;
            padding-bottom: 16px;
            margin-bottom: 20px;
          }
          .brand-title {
            font-family: Georgia, serif;
            font-size: 24px;
            letter-spacing: 0.15em;
            color: #111;
            font-weight: 700;
            margin: 0;
          }
          .brand-sub {
            font-size: 11px;
            text-transform: uppercase;
            letter-spacing: 0.1em;
            color: #b78938;
            font-weight: 600;
          }
          .report-meta {
            text-align: right;
            font-size: 11px;
            color: #666;
          }
          .kpi-row {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 12px;
            margin-bottom: 24px;
          }
          .kpi-card {
            background: #f9fafb;
            border: 1px solid #e5e7eb;
            border-radius: 8px;
            padding: 12px 14px;
          }
          .kpi-val {
            font-size: 20px;
            font-weight: 700;
            color: #111;
            font-family: monospace;
          }
          .kpi-label {
            font-size: 10px;
            text-transform: uppercase;
            color: #6b7280;
            letter-spacing: 0.05em;
            margin-top: 2px;
          }
          .story-card {
            border: 1px solid #e5e7eb;
            border-radius: 8px;
            padding: 16px;
            margin-bottom: 16px;
            page-break-inside: avoid;
            background: #ffffff;
          }
          .story-header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            gap: 12px;
            margin-bottom: 8px;
          }
          .story-title {
            display: flex;
            align-items: center;
            gap: 8px;
          }
          .story-num {
            font-family: monospace;
            font-size: 10px;
            background: #111;
            color: #fff;
            padding: 2px 6px;
            border-radius: 4px;
            font-weight: 600;
          }
          .story-header h3 {
            margin: 0;
            font-size: 14px;
            font-weight: 700;
            color: #111;
          }
          .story-desc {
            font-size: 12px;
            color: #4b5563;
            margin-bottom: 8px;
            padding-left: 2px;
          }
          .story-ac {
            font-size: 11px;
            background: #fdf8ed;
            border: 1px solid #fae8c8;
            border-radius: 6px;
            padding: 8px 10px;
            color: #8c672b;
            margin-bottom: 10px;
          }
          .tasks-table {
            width: 100%;
            border-collapse: collapse;
            font-size: 11px;
            margin-top: 6px;
          }
          .tasks-table th, .tasks-table td {
            border: 1px solid #e5e7eb;
            padding: 6px 10px;
            text-align: left;
            vertical-align: top;
          }
          .tasks-table th {
            background: #f9fafb;
            font-size: 10px;
            text-transform: uppercase;
            color: #6b7280;
          }
          .badge {
            font-size: 9px;
            font-weight: 700;
            text-transform: uppercase;
            padding: 2px 7px;
            border-radius: 4px;
            display: inline-block;
          }
          .tag-fulfilled { background: #dcfce7; color: #15803d; border: 1px solid #bbf7d0; }
          .tag-inprogress { background: #fef3c7; color: #b45309; border: 1px solid #fde68a; }
          .tag-notstarted { background: #f3f4f6; color: #4b5563; border: 1px solid #e5e7eb; }
          .badge-outline { background: #ffffff; color: #4b5563; border: 1px solid #d1d5db; font-family: monospace; }
          .action-bar {
            position: fixed;
            bottom: 20px;
            right: 20px;
            display: flex;
            gap: 10px;
            z-index: 100;
          }
          .btn-print {
            background: #b78938;
            color: #000;
            border: none;
            padding: 10px 18px;
            font-weight: 700;
            border-radius: 8px;
            cursor: pointer;
            box-shadow: 0 4px 15px rgba(0,0,0,0.15);
          }
          .btn-close {
            background: #111;
            color: #fff;
            border: none;
            padding: 10px 16px;
            font-weight: 600;
            border-radius: 8px;
            cursor: pointer;
          }
          @media print {
            body { padding: 15px; }
            .action-bar { display: none !important; }
            @page { margin: 15mm; }
          }
        </style>
      </head>
      <body>
        <div class="action-bar">
          <button class="btn-print" onclick="window.print()">🖨️ Print / Save as PDF</button>
          <button class="btn-close" onclick="window.close()">Close Window</button>
        </div>

        <div class="header">
          <div>
            <h1 class="brand-title">RIVLET</h1>
            <div class="brand-sub">Executive Sprint Workload & Delivery Audit Report</div>
          </div>
          <div class="report-meta">
            <div><strong>Target Scope:</strong> ${targetSprintName}</div>
            <div><strong>Production Partner:</strong> Layo Group</div>
            <div><strong>Generated:</strong> ${reportDate}</div>
          </div>
        </div>

        <div class="kpi-row">
          <div class="kpi-card">
            <div class="kpi-val">${totalStories}</div>
            <div class="kpi-label">User Stories</div>
          </div>
          <div class="kpi-card">
            <div class="kpi-val">${totalTasks}</div>
            <div class="kpi-label">Child Tasks</div>
          </div>
          <div class="kpi-card">
            <div class="kpi-val" style="color:#15803d;">${completedTasks}</div>
            <div class="kpi-label">Criteria Fulfilled</div>
          </div>
          <div class="kpi-card">
            <div class="kpi-val" style="color:#b45309;">${activeTasks + newTasks}</div>
            <div class="kpi-label">Incomplete / Backlog</div>
          </div>
        </div>

        <h2 style="font-size:14px; text-transform:uppercase; letter-spacing:0.08em; color:#111; border-bottom:1px solid #e5e7eb; padding-bottom:6px; margin-bottom:14px;">
          Workload Breakdown & Acceptance Criteria Audit
        </h2>

        ${storiesHtml}

        <script>
          window.addEventListener('load', function() {
            setTimeout(function() {
              window.print();
            }, 600);
          });
        </script>
      </body>
      </html>
    `;

    printWindow.document.open();
    printWindow.document.write(htmlContent);
    printWindow.document.close();
    notify.success('Workload Report Ready', 'Executive report opened in new window. Print or save as PDF.');
  };

  const unifiedButtonLabel = useMemo(() => {
    if (includeExistingWorkload) {
      return outputFormat === 'prompt'
        ? 'Copy Complete AI Prompt (With Existing Workload & JSON Schema)'
        : 'Copy Current Workload (JSON Format)';
    } else {
      return outputFormat === 'prompt'
        ? 'Copy AI Planning Prompt (Clean JSON Template Only)'
        : 'Copy Clean Target JSON Schema';
    }
  }, [includeExistingWorkload, outputFormat]);

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
              <h2 className="text-lg sm:text-xl font-bold text-white">Sprint Bulk Creation & AI Importer</h2>
            </div>
            <p className="text-xs sm:text-sm text-[#94a3b8] max-w-2xl">
              Paste structured story & task data generated with your AI tools (Claude, ChatGPT, Gemini). The importer automatically creates both the User Stories and their corresponding child Tasks with full descriptions and acceptance criteria.
            </p>
          </div>

          <div className="flex items-center flex-wrap gap-2.5 flex-shrink-0">
            <button
              onClick={handleCopyPrompt}
              title="Copy prompt for your AI tool (includes task description & acceptance criteria)"
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#141926] border border-[#222c42] text-xs font-semibold text-[#cbd5e1] hover:text-white hover:border-[#38486b] transition-all"
            >
              {copiedPrompt ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-[#cda052]" />}
              {copiedPrompt ? 'Prompt Copied!' : 'Copy AI Prompt'}
            </button>

            {/* Consolidate & Review Workload Button */}
            <button
              onClick={() => setShowConsolidateModal(true)}
              title="Consolidate and review current sprint workload to prompt AI for next stories"
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-[#172033] to-[#121827] border border-[#cda052]/40 text-xs font-semibold text-[#e6c875] hover:text-white hover:border-[#cda052] hover:shadow-[0_0_12px_rgba(205,160,82,0.2)] transition-all cursor-pointer"
            >
              <Layers className="w-3.5 h-3.5 text-[#cda052]" />
              <span>Consolidate & Review Workload</span>
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
                Created {createdSummary.stories} User Stor{createdSummary.stories === 1 ? 'y' : 'ies'} and {createdSummary.tasks} Task{createdSummary.tasks === 1 ? '' : 's'} with full descriptions and acceptance criteria.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => onNavigateToBoard?.(resolvedConsolidateSprint?.id)}
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
                  onClick={() => setFormatMode('json')}
                  className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${
                    formatMode === 'json' ? 'bg-[#cda052] text-black font-semibold' : 'text-[#8493ab] hover:text-white'
                  }`}
                >
                  JSON
                </button>
                <button
                  onClick={() => setFormatMode('yaml')}
                  className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${
                    formatMode === 'yaml' ? 'bg-[#cda052] text-black font-semibold' : 'text-[#8493ab] hover:text-white'
                  }`}
                >
                  YAML
                </button>
              </div>
            </div>

            <p className="text-xs text-[#94a3b8] leading-relaxed">
              Match your prompt to include these exact fields. Each task includes a dedicated <span className="text-[#cda052] font-semibold">description</span> and <span className="text-emerald-400 font-semibold">acceptance_criteria</span>!
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
                <div className="text-[#cbd5e1]"><span className="text-[#cda052] font-semibold">priority:</span> P1, P2, P3, P4</div>
                <div className="text-[#cbd5e1]"><span className="text-[#cda052] font-semibold">points:</span> 1 to 8 pts</div>
                <div className="text-[#cbd5e1]"><span className="text-[#cda052] font-semibold">assignee:</span> Unassigned / Name</div>
                <div className="text-[#cbd5e1]"><span className="text-[#cda052] font-semibold">sprint:</span> Sprint 1, Sprint 2</div>
                <div className="text-[#cbd5e1]"><span className="text-[#cda052] font-semibold">manufacture:</span> Layo Group</div>
                <div className="text-[#cbd5e1]"><span className="text-[#cda052] font-semibold">styles:</span> All Styles / single</div>
                <div className="text-[#cbd5e1]"><span className="text-[#cda052] font-semibold">tasks:</span> List of subtasks</div>
                <div className="text-[#cbd5e1] col-span-2"><span className="text-[#cda052] font-semibold">task.description:</span> Detailed task instructions</div>
                <div className="text-[#cbd5e1] col-span-2"><span className="text-emerald-400 font-semibold">task.acceptance_criteria:</span> Criteria to sign-off task</div>
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
                  onClick={() => { setRawInput(''); setParsedStories([]); setParseErrors([]); }}
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
              placeholder={`Paste your AI-generated JSON or YAML here...\n\nExample JSON:\n[\n  {\n    "user_story": "Finalize proto sample fit & sizing specs",\n    "priority": "P1",\n    "points": 5,\n    "assignee": "Unassigned",\n    "sprint": "Sprint 1",\n    "manufacture": "Layo Group",\n    "styles": "All Styles",\n    "description": "Lead fit sessions with sample master...",\n    "acceptance_criteria": "Fit trial approved across XS, S, M...",\n    "tasks": [\n      {\n        "title": "Audit proto sample waist tension & stretch recovery",\n        "priority": "P1",\n        "points": 2,\n        "assignee": "Unassigned",\n        "description": "Perform tensile testing across 25 cycles...",\n        "acceptance_criteria": "Elastic recovery >= 95%..."\n      }\n    ]\n  }\n]`}
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
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#cda052] to-[#a97f38] text-black text-xs font-bold hover:shadow-glow transition-all disabled:opacity-50 cursor-pointer"
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
                {parsedStories.reduce((acc, s) => acc + s.tasks.length, 0)} linked sub-tasks with descriptions & acceptance criteria.
              </p>
            </div>

            <button
              onClick={handleCreateAll}
              disabled={isSubmitting}
              className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-[#cda052] to-[#a97f38] text-black text-sm font-bold hover:shadow-glow transition-all disabled:opacity-60 flex-shrink-0 cursor-pointer"
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

                {/* Subtasks inside preview with descriptions and acceptance criteria */}
                {story.tasks.length > 0 && (
                  <div className="pt-2 border-t border-[#161c28] space-y-2">
                    <span className="text-[11px] font-semibold text-[#64748b] uppercase tracking-wider block">
                      Sub-tasks to create ({story.tasks.length}):
                    </span>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                      {story.tasks.map((task, tIdx) => (
                        <div
                          key={tIdx}
                          className="p-3 rounded-lg bg-[#0c1018] border border-[#192235] text-xs space-y-1.5"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <span className="text-white font-medium flex-1">
                              ↳ Task {idx + 1}.{tIdx + 1}: {task.title}
                            </span>
                            <span className="text-[10px] font-mono text-[#cda052] bg-[#141b2b] px-1.5 py-0.5 rounded border border-[#232e47] flex-shrink-0">
                              {task.points} pt{task.points === 1 ? '' : 's'}
                            </span>
                          </div>

                          {task.description && (
                            <p className="text-[11px] text-[#94a3b8] leading-normal">{task.description}</p>
                          )}

                          {task.acceptanceCriteria && (
                            <p className="text-[11px] text-emerald-300/90 bg-emerald-950/30 border border-emerald-900/40 p-1.5 rounded">
                              <span className="text-emerald-400 font-semibold">Acceptance Criteria: </span>{task.acceptanceCriteria}
                            </p>
                          )}
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

      {/* CONSOLIDATE & REVIEW WORKLOAD MODAL */}
      <ModalPortal isOpen={showConsolidateModal}>
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-2 sm:p-4 md:p-6 bg-black/85 backdrop-blur-md"
          onClick={() => setShowConsolidateModal(false)}
        >
          <div
            className="w-full max-w-5xl max-h-[92vh] flex flex-col rounded-2xl border border-[#1f2638] bg-[#090b11] shadow-2xl shadow-black overflow-hidden"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label="Consolidate and review current sprint workload"
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#171d2b] bg-[#0c1018]/90">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-[#cda052]/10 border border-[#cda052]/30 text-[#e6c875]">
                  <Layers className="w-5 h-5 text-[#cda052]" />
                </div>
                <div>
                  <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                    Consolidate & Review Workload
                  </h2>
                  <p className="text-xs text-[#94a3b8]">
                    Review current stories, descriptions, acceptance criteria & progress, then copy context to prompt external AI for remaining work.
                  </p>
                </div>
              </div>

              <button
                onClick={() => setShowConsolidateModal(false)}
                className="p-1.5 rounded-lg text-[#7c869d] hover:text-white hover:bg-[#161d2b] transition-colors"
                title="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Target Sprint Selector Bar */}
            <div className="px-5 py-3 border-b border-[#171d2b] bg-[#0f1422] flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 flex-wrap">
                <span className="text-xs text-[#94a3b8] font-medium whitespace-nowrap">Target Sprint:</span>
                <select
                  value={selectedConsolidateSprintId}
                  onChange={(e) => setSelectedConsolidateSprintId(e.target.value)}
                  className="px-3 py-1.5 rounded-xl bg-[#080a10] border border-[#232e47] text-xs font-semibold text-white focus:outline-none focus:border-[#cda052]"
                >
                  <option value="active">Active Sprint ({activeSprint ? activeSprint.name : 'Current'})</option>
                  {sprints.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.startDate.slice(5)} to {s.endDate.slice(5)})
                    </option>
                  ))}
                  <option value="all">All Sprints & Backlog Items</option>
                </select>
              </div>

              <span className="text-[11px] text-[#7c869d] hidden sm:inline">
                Partner: <strong className="text-white">Layo Group</strong>
              </span>
            </div>

            {/* OPTIMIZED SELECTION WINDOW & SINGLE COPY BUTTON */}
            <div className="p-4 sm:p-5 border-b border-[#171d2b] bg-[#0b0f19] space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
                {/* Selection Option 1: Include Existing Workload Checkbox (Tick Mark) */}
                <div
                  onClick={() => setIncludeExistingWorkload(!includeExistingWorkload)}
                  className={`md:col-span-8 p-3.5 rounded-xl border transition-all cursor-pointer flex items-start gap-3 select-none ${
                    includeExistingWorkload
                      ? 'bg-[#121929] border-[#cda052]/70 shadow-[0_0_15px_rgba(205,160,82,0.12)]'
                      : 'bg-[#080b12] border-[#1a2337] hover:border-[#2a3754]'
                  }`}
                >
                  <div
                    className={`w-5 h-5 rounded-md flex items-center justify-center mt-0.5 transition-colors flex-shrink-0 ${
                      includeExistingWorkload
                        ? 'bg-[#cda052] text-black shadow-sm font-bold'
                        : 'border border-[#323d57] bg-[#0c101a]'
                    }`}
                  >
                    {includeExistingWorkload && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-bold text-white">Include Current Sprint Workload Context</span>
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-[#1a243a] text-[#cda052] font-semibold border border-[#2b3a5c]">
                        {consolidatedStories.length} Stories · {consolidatedTasks.length} Tasks
                      </span>
                    </div>
                    <p className="text-[11px] text-[#94a3b8] leading-relaxed">
                      Embeds all currently listed stories & tasks categorized by status (Completed, In-Progress, New/Pending) with full descriptions and criteria, so external AI knows what is already finished vs what is left to plan.
                    </p>
                  </div>
                </div>

                {/* Selection Option 2: Output Format Mode (Prompt vs JSON) */}
                <div className="md:col-span-4 p-3.5 rounded-xl bg-[#080b12] border border-[#1a2337] flex flex-col justify-between gap-2">
                  <div>
                    <span className="text-xs font-bold text-white block mb-0.5">Prompt Output Format</span>
                    <p className="text-[10px] text-[#7c869d]">Choose Markdown prompt or pure JSON format.</p>
                  </div>
                  <div className="grid grid-cols-2 gap-1.5 bg-[#05070c] p-1 rounded-xl border border-[#172033]">
                    <button
                      onClick={() => setOutputFormat('prompt')}
                      className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1.5 ${
                        outputFormat === 'prompt'
                          ? 'bg-gradient-to-r from-[#cda052] to-[#a97f38] text-black shadow-sm'
                          : 'text-[#8290ab] hover:text-white'
                      }`}
                    >
                      <Sparkles className="w-3 h-3" />
                      <span>AI Prompt</span>
                    </button>
                    <button
                      onClick={() => setOutputFormat('json')}
                      className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1.5 ${
                        outputFormat === 'json'
                          ? 'bg-gradient-to-r from-[#cda052] to-[#a97f38] text-black shadow-sm'
                          : 'text-[#8290ab] hover:text-white'
                      }`}
                    >
                      <FileText className="w-3 h-3" />
                      <span>JSON Only</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* SINGLE UNIFIED COPY BUTTON BELOW SELECTION WINDOW */}
              <div className="space-y-2">
                <button
                  onClick={handleUnifiedCopy}
                  className="w-full flex items-center justify-center gap-2.5 px-6 py-3 rounded-xl bg-gradient-to-r from-[#cda052] via-[#dfb66a] to-[#a97f38] text-black text-xs sm:text-sm font-bold hover:shadow-[0_0_20px_rgba(205,160,82,0.35)] transition-all cursor-pointer active:scale-[0.99]"
                >
                  {copiedUnified ? (
                    <>
                      <Check className="w-4 h-4 stroke-[3] text-black" />
                      <span>Copied to Clipboard! Ready to paste into ChatGPT / Claude / Gemini</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4 text-black" />
                      <span>{unifiedButtonLabel}</span>
                    </>
                  )}
                </button>

                <div className="flex items-center justify-between text-[11px] text-[#7c869d] px-1">
                  <span>
                    {includeExistingWorkload
                      ? `Context includes: ${consolidatedStories.length} stories, ${consolidatedTasks.length} tasks, status breakdown & target JSON schema`
                      : 'Context includes: Clean AI instructions & target delivery JSON schema template only'}
                  </span>
                  <button
                    onClick={() => setShowPreviewText(!showPreviewText)}
                    className="text-[#cda052] hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    {showPreviewText ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                    <span>{showPreviewText ? 'Hide Prompt Preview' : 'Preview Generated Prompt'}</span>
                  </button>
                </div>

                {showPreviewText && (
                  <pre className="p-3.5 rounded-xl bg-[#06080e] border border-[#1b253b] text-[11px] font-mono text-[#a5b4fc] overflow-x-auto max-h-48 leading-relaxed whitespace-pre-wrap">
                    {generateConsolidatedContent()}
                  </pre>
                )}
              </div>
            </div>

            {/* Metrics Overview Bar */}
            <div className="px-5 py-3 border-b border-[#141b2b] bg-[#0a0d14] grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="p-2.5 rounded-xl bg-[#0f1422] border border-[#1b253b]">
                <span className="text-[10px] text-[#7c869d] block uppercase tracking-wider">User Stories</span>
                <span className="text-base font-bold text-white mt-0.5 block">{sprintStats.totalStories} Stories</span>
              </div>
              <div className="p-2.5 rounded-xl bg-[#0f1422] border border-[#1b253b]">
                <span className="text-[10px] text-[#7c869d] block uppercase tracking-wider">Child Tasks</span>
                <span className="text-base font-bold text-white mt-0.5 block">{sprintStats.totalTasks} Tasks</span>
              </div>
              <div className="p-2.5 rounded-xl bg-[#0f1422] border border-[#1b253b]">
                <span className="text-[10px] text-[#7c869d] block uppercase tracking-wider">Story Points</span>
                <span className="text-base font-bold text-[#cda052] mt-0.5 block">
                  {sprintStats.donePoints} / {sprintStats.totalPoints} pts
                </span>
              </div>
              <div className="p-2.5 rounded-xl bg-[#0f1422] border border-[#1b253b]">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-[#7c869d] block uppercase tracking-wider">Completion</span>
                  <span className="text-xs font-bold text-emerald-400">{sprintStats.progressPercent}%</span>
                </div>
                <div className="w-full bg-[#1b2234] h-1.5 rounded-full mt-2 overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-[#cda052] to-emerald-400 h-full rounded-full transition-all"
                    style={{ width: `${sprintStats.progressPercent}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Scrollable Workload List */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4 max-h-[50vh]">
              {consolidatedStories.length === 0 ? (
                <div className="p-12 text-center text-[#74829c] space-y-2">
                  <Layers className="w-8 h-8 text-[#414d64] mx-auto mb-2" />
                  <p className="text-sm font-medium text-white">No stories found in this sprint</p>
                  <p className="text-xs">Use the Raw Creation Input Box to paste and generate stories & tasks.</p>
                </div>
              ) : (
                consolidatedStories.map((story, idx) => {
                  const tasks = consolidatedTasks.filter((t) => t.parentId === story.id);
                  const closedTasks = tasks.filter((t) => t.state === 'Closed' || t.state === 'Resolved').length;

                  return (
                    <div
                      key={story.id}
                      className="p-4 rounded-xl border border-[#1a2336] bg-[#0c1018] space-y-3 hover:border-[#2d3b59] transition-all"
                    >
                      {/* Header Row */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-[#cda052]/20 text-[#cda052] border border-[#cda052]/40">
                            Story #{idx + 1}
                          </span>
                          <span className={`text-[9px] px-2 py-0.5 rounded border font-semibold ${TYPE_COLOR[story.type]}`}>
                            {story.type}
                          </span>
                          <span className={`text-[9px] px-2 py-0.5 rounded border font-medium ${STATE_COLOR[story.state]}`}>
                            {story.state}
                          </span>
                          <span className={`text-[9px] px-2 py-0.5 rounded border font-medium ${PRIORITY_BADGE_COLOR[story.priority]}`}>
                            {PRIORITY_LABEL[story.priority]}
                          </span>
                          <span className="text-[10px] px-2 py-0.5 rounded bg-[#101824] border border-[#1e2e48] text-amber-300 font-medium flex items-center gap-1">
                            <Factory className="w-2.5 h-2.5 text-amber-400" /> Layo Group
                          </span>
                          {story.assignee && (
                            <span className="text-[10px] text-[#cbd5e1] flex items-center gap-1 bg-[#131b2c] px-2 py-0.5 rounded border border-[#202d48]">
                              <User className="w-2.5 h-2.5 text-[#cda052]" /> {story.assignee}
                            </span>
                          )}
                        </div>

                        <span className="text-xs font-mono text-[#94a3b8] flex-shrink-0">
                          {story.storyPoints || 0} pts · {closedTasks}/{tasks.length} tasks done
                        </span>
                      </div>

                      {/* Title */}
                      <h3 className="text-sm font-bold text-white">{story.title}</h3>

                      {/* Description */}
                      {story.description ? (
                        <div className="p-3 rounded-lg bg-[#07090e] border border-[#171f30] text-xs text-[#cbd5e1] leading-relaxed whitespace-pre-wrap">
                          <span className="text-[10px] font-semibold text-[#6f7e9a] uppercase tracking-wider block mb-1">
                            Description:
                          </span>
                          {story.description}
                        </div>
                      ) : (
                        <p className="text-xs text-[#525f78] italic">No description logged.</p>
                      )}

                      {/* Acceptance Criteria */}
                      {story.acceptanceCriteria && (
                        <div className="p-3 rounded-lg bg-emerald-950/20 border border-emerald-900/40 text-xs text-emerald-200/90 leading-relaxed whitespace-pre-wrap">
                          <span className="text-[10px] font-semibold text-emerald-400 uppercase tracking-wider block mb-1">
                            Acceptance Criteria:
                          </span>
                          {story.acceptanceCriteria}
                        </div>
                      )}

                      {/* Child Tasks List */}
                      {tasks.length > 0 && (
                        <div className="pt-2 border-t border-[#161d2d] space-y-2">
                          <span className="text-[11px] font-semibold text-[#6f7e9a] uppercase tracking-wider block">
                            Child Tasks ({tasks.length}):
                          </span>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                            {tasks.map((t, tIdx) => {
                              const isTaskDone = t.state === 'Closed' || t.state === 'Resolved';
                              const isTaskActive = t.state === 'Active' || t.state === 'In Review';

                              return (
                                <div
                                  key={t.id}
                                  className="p-2.5 rounded-lg bg-[#080b12] border border-[#182133] text-xs space-y-1.5"
                                >
                                  <div className="flex items-center justify-between gap-1.5">
                                    <span className="text-white font-medium truncate flex-1">
                                      ↳ Task {idx + 1}.{tIdx + 1}: {t.title}
                                    </span>
                                    <span className={`text-[8px] px-1.5 py-0.2 rounded border font-medium ${STATE_COLOR[t.state]}`}>
                                      {t.state}
                                    </span>
                                  </div>
                                  {t.description && (
                                    <p className="text-[11px] text-[#94a3b8] line-clamp-2">{t.description}</p>
                                  )}
                                  {t.acceptanceCriteria && (
                                    <p
                                      className={`text-[10px] p-1.5 rounded border ${
                                        isTaskDone
                                          ? 'text-emerald-300/90 bg-emerald-950/30 border-emerald-900/40'
                                          : isTaskActive
                                          ? 'text-amber-300/90 bg-amber-950/20 border-amber-900/40'
                                          : 'text-sky-300/90 bg-sky-950/20 border-sky-900/40'
                                      }`}
                                    >
                                      <strong
                                        className={
                                          isTaskDone
                                            ? 'text-emerald-400'
                                            : isTaskActive
                                            ? 'text-amber-400'
                                            : 'text-sky-400'
                                        }
                                      >
                                        {isTaskDone
                                          ? 'Acceptance Criteria (Fulfilled): '
                                          : isTaskActive
                                          ? 'Acceptance Criteria (Pending Fulfillment): '
                                          : 'Acceptance Criteria (Requirements - Not Started): '}
                                      </strong>
                                      {t.acceptanceCriteria}
                                    </p>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-5 py-3 border-t border-[#171d2b] bg-[#0c1018] flex flex-col sm:flex-row items-center justify-between gap-3">
              <span className="text-xs text-[#7c869d]">
                Manufacturer set to Layo Group. Toggle existing workload context above to customize the exported AI prompt.
              </span>
              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                <button
                  onClick={handleGenerateReport}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-[#cda052] to-[#a97f38] text-black text-xs font-bold hover:shadow-glow transition-all cursor-pointer whitespace-nowrap"
                  title="Generate printable executive workload report or save as PDF"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Generate Report (Print / PDF)</span>
                </button>
                <button
                  onClick={() => setShowConsolidateModal(false)}
                  className="px-4 py-2 rounded-xl bg-[#141926] border border-[#222c42] text-xs font-semibold text-[#cbd5e1] hover:text-white cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      </ModalPortal>
    </div>
  );
}
