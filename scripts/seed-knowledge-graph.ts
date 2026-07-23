import * as dotenv from 'dotenv';
import path from 'path';
import { adminDb } from '../src/lib/firebase-admin';
import type { RoleBlueprint, CheckpointTemplate, SeedQuestion } from '../src/types/route';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

// =============================================================================
// HELPER: Shorthand for creating seed questions
// =============================================================================
function mcq(id: string, q: string, opts: string[], answer: string, diff: SeedQuestion['difficulty'] = 'intermediate'): SeedQuestion {
  return { id, questionText: q, questionType: 'multiple_choice', options: opts, correctAnswer: answer, difficulty: diff };
}
function freeText(id: string, q: string, rubric: string, diff: SeedQuestion['difficulty'] = 'intermediate'): SeedQuestion {
  return { id, questionText: q, questionType: 'free_text', evaluationRubric: rubric, difficulty: diff };
}
function scenario(id: string, q: string, rubric: string, diff: SeedQuestion['difficulty'] = 'advanced'): SeedQuestion {
  return { id, questionText: q, questionType: 'scenario', evaluationRubric: rubric, difficulty: diff };
}

// =============================================================================
// BLUEPRINT 1: Frontend Engineer (React) — FULLY FLESHED
// 5 Checkpoints · 12 Modules · 44 Chapters
// =============================================================================
const frontendCheckpoints: CheckpointTemplate[] = [
  {
    id: 'cp-react-core',
    title: 'Core React Mastery',
    skillCategory: 'technical',
    isOptional: false,
    dependencies: [],
    estimatedWeeks: 2,
    moduleTemplates: [
      {
        id: 'mod-advanced-hooks',
        title: 'Advanced Hooks',
        isOptional: false,
        chapterTemplates: [
          {
            id: 'ch-usestate-patterns', title: 'useState Patterns & Pitfalls', skillTag: 'react-hooks',
            validationMethod: 'objective', estimatedMins: 30,
            preparationHints: { preferredContentType: 'video', keyTopics: ['Lazy initialization', 'Functional updates', 'Stale closure'] },
            seedQuestions: [
              mcq('sq-1', 'What happens when you call setState with the same value as the current state?', ['Component re-renders', 'React bails out of the render', 'An error is thrown', 'The state is reset'], 'React bails out of the render'),
              mcq('sq-2', 'When should you use the functional form of setState?', ['Always', 'When next state depends on previous state', 'When state is an object', 'Never'], 'When next state depends on previous state'),
              freeText('sq-3', 'Explain the "stale closure" problem in React hooks and how to fix it.', 'Should mention: closures capture variable values at render time; useRef or functional updates as solutions; concrete example of a counter or timer.'),
            ]
          },
          {
            id: 'ch-usereducer', title: 'useReducer for Complex State', skillTag: 'react-hooks',
            validationMethod: 'objective+practical', estimatedMins: 45,
            preparationHints: { preferredContentType: 'video', keyTopics: ['State transitions', 'Action payloads', 'Context + useReducer'] },
            seedQuestions: [
              mcq('sq-4', 'When is useReducer preferred over useState?', ['Always', 'When state logic is complex with multiple sub-values', 'When performance is critical', 'When using TypeScript'], 'When state logic is complex with multiple sub-values'),
              freeText('sq-5', 'Write a useReducer implementation for a shopping cart with add, remove, and update quantity actions.', 'Should include: reducer function with switch/if, action types with payloads, initial state shape, dispatch usage.'),
              scenario('sq-6', 'Your team has a form with 12 fields, each with validation. A junior dev implemented it with 12 separate useState calls. What would you recommend and why?', 'Should recommend useReducer or a form library; explain benefits of centralized state; mention action-based updates for validation logic.'),
            ]
          },
          {
            id: 'ch-custom-hooks', title: 'Building Custom Hooks', skillTag: 'react-hooks',
            validationMethod: 'practical', estimatedMins: 40,
            preparationHints: { preferredContentType: 'article', keyTopics: ['Extraction patterns', 'Hook composition', 'Testing hooks'] },
            seedQuestions: [
              mcq('sq-7', 'What is the naming convention for custom hooks?', ['start with "hook"', 'start with "use"', 'start with "custom"', 'no convention'], 'start with "use"'),
              freeText('sq-8', 'Design a useDebounce hook that debounces a value by a configurable delay.', 'Should use useState + useEffect with cleanup; accept value and delay as params; return debounced value.'),
              freeText('sq-9', 'Explain when you should extract logic into a custom hook vs keeping it in the component.', 'Should mention: reusability across components, testability, separation of concerns, readability.'),
            ]
          },
          {
            id: 'ch-useeffect-mastery', title: 'useEffect Deep Dive', skillTag: 'react-hooks',
            validationMethod: 'objective+practical', estimatedMins: 45,
            preparationHints: { preferredContentType: 'video', keyTopics: ['Dependency array', 'Cleanup functions', 'Race conditions'] },
            seedQuestions: [
              mcq('sq-10', 'What does an empty dependency array in useEffect mean?', ['Effect runs every render', 'Effect runs only on mount', 'Effect never runs', 'Effect runs on unmount'], 'Effect runs only on mount'),
              mcq('sq-11', 'What is the purpose of the cleanup function returned from useEffect?', ['To reset state', 'To cancel subscriptions and prevent memory leaks', 'To trigger a re-render', 'To update the DOM'], 'To cancel subscriptions and prevent memory leaks'),
              scenario('sq-12', 'You have a useEffect that fetches data based on a search query. Users report stale data appearing briefly. Diagnose and fix the issue.', 'Should identify: race condition from rapid query changes; suggest: abort controller, cleanup function to ignore stale responses, or a flag pattern.'),
            ]
          },
        ]
      },
      {
        id: 'mod-state-management',
        title: 'State Management Patterns',
        isOptional: false,
        chapterTemplates: [
          {
            id: 'ch-context-api', title: 'React Context for Global State', skillTag: 'react-state',
            validationMethod: 'objective', estimatedMins: 35,
            preparationHints: { preferredContentType: 'article', keyTopics: ['Provider pattern', 'Context splitting', 'Performance implications'] },
            seedQuestions: [
              mcq('sq-13', 'What is the main performance concern with React Context?', ['It is slow to create', 'All consumers re-render when the context value changes', 'It cannot hold objects', 'It conflicts with Redux'], 'All consumers re-render when the context value changes'),
              freeText('sq-14', 'Explain the "context splitting" pattern and when you would use it.', 'Should mention: separating state and dispatch into different contexts; prevents unnecessary re-renders of components that only dispatch.'),
              freeText('sq-15', 'When would you choose Context over a state management library like Zustand or Redux?', 'Should mention: small/medium apps, infrequent updates, theme/auth/locale state; libraries better for frequent updates and complex state.'),
            ]
          },
          {
            id: 'ch-server-state', title: 'Server State with TanStack Query', skillTag: 'react-data',
            validationMethod: 'practical', estimatedMins: 50,
            preparationHints: { preferredContentType: 'video', keyTopics: ['Query keys', 'Caching', 'Optimistic updates', 'Stale-while-revalidate'] },
            seedQuestions: [
              mcq('sq-16', 'What does "stale-while-revalidate" mean in TanStack Query?', ['Data is deleted when stale', 'Stale data is shown while fresh data is fetched in background', 'Stale data triggers an error', 'Data is never cached'], 'Stale data is shown while fresh data is fetched in background'),
              freeText('sq-17', 'Explain how you would implement an optimistic update for a "like" button using TanStack Query.', 'Should mention: onMutate to update cache optimistically, onError to rollback, onSettled to refetch for consistency.'),
            ]
          },
        ]
      },
      {
        id: 'mod-component-patterns',
        title: 'Advanced Component Patterns',
        isOptional: false,
        chapterTemplates: [
          {
            id: 'ch-composition', title: 'Composition Over Inheritance', skillTag: 'react-patterns',
            validationMethod: 'objective', estimatedMins: 30,
            preparationHints: { preferredContentType: 'article', keyTopics: ['Children prop', 'Render props', 'Compound components'] },
            seedQuestions: [
              freeText('sq-18', 'Explain the compound component pattern with an example.', 'Should describe: parent manages state, children access via context; example like Tabs/Tab or Select/Option.'),
              mcq('sq-19', 'Which pattern is preferred in modern React for sharing logic?', ['Higher-Order Components', 'Render Props', 'Custom Hooks', 'Mixins'], 'Custom Hooks'),
            ]
          },
          {
            id: 'ch-performance', title: 'React Performance Optimization', skillTag: 'react-perf',
            validationMethod: 'practical', estimatedMins: 45,
            preparationHints: { preferredContentType: 'video', keyTopics: ['React.memo', 'useMemo', 'useCallback', 'React Profiler'] },
            seedQuestions: [
              mcq('sq-20', 'What does React.memo do?', ['Memoizes the return value of a function', 'Prevents re-renders if props haven\'t changed', 'Caches API responses', 'Reduces bundle size'], 'Prevents re-renders if props haven\'t changed'),
              scenario('sq-21', 'A list of 500 items re-renders entirely when any single item changes. The user reports lag when toggling items. How would you diagnose and fix this?', 'Should mention: React Profiler to identify wasted renders, React.memo on list items, stable callback refs with useCallback, virtualization (react-window) if needed.'),
              freeText('sq-22', 'Explain the difference between useMemo and useCallback and when to use each.', 'useMemo memoizes a computed value; useCallback memoizes a function reference. Use useMemo for expensive computations, useCallback for stable references passed to memoized children.'),
            ]
          },
        ]
      },
    ]
  },
  {
    id: 'cp-testing',
    title: 'Frontend Testing',
    skillCategory: 'technical',
    isOptional: false,
    dependencies: ['cp-react-core'],
    estimatedWeeks: 1.5,
    moduleTemplates: [
      {
        id: 'mod-unit-testing',
        title: 'Unit Testing with Jest & RTL',
        isOptional: false,
        chapterTemplates: [
          {
            id: 'ch-rtl-basics', title: 'Testing User Interactions', skillTag: 'react-testing',
            validationMethod: 'practical', estimatedMins: 50,
            preparationHints: { preferredContentType: 'article', keyTopics: ['userEvent', 'screen queries', 'ARIA roles', 'getByRole'] },
            seedQuestions: [
              mcq('sq-23', 'Which query is recommended as the primary way to find elements in RTL?', ['getByTestId', 'getByRole', 'querySelector', 'getByClassName'], 'getByRole'),
              freeText('sq-24', 'Write a test that verifies a login form shows an error message when submitted with an empty email.', 'Should use: render, screen.getByRole for button, userEvent.click, waitFor or findBy for error message.'),
            ]
          },
          {
            id: 'ch-async-testing', title: 'Testing Async Operations', skillTag: 'react-testing',
            validationMethod: 'practical', estimatedMins: 40,
            preparationHints: { preferredContentType: 'video', keyTopics: ['waitFor', 'findBy queries', 'MSW for mocking', 'act warnings'] },
            seedQuestions: [
              freeText('sq-25', 'Explain how to test a component that fetches data on mount using MSW (Mock Service Worker).', 'Should mention: setupServer, rest.get handler, render component, use findBy* to wait for data, assert on rendered content.'),
              mcq('sq-26', 'What does the `act` warning in React tests typically mean?', ['A test is too slow', 'A state update happened outside of act()', 'The component has a bug', 'Jest is outdated'], 'A state update happened outside of act()'),
            ]
          },
          {
            id: 'ch-test-patterns', title: 'Testing Patterns & Best Practices', skillTag: 'react-testing',
            validationMethod: 'objective', estimatedMins: 35,
            preparationHints: { preferredContentType: 'article', keyTopics: ['Testing trophy', 'Implementation details', 'Test coverage strategy'] },
            seedQuestions: [
              freeText('sq-27', 'What does Kent C. Dodds mean by "test implementation details" and why should you avoid it?', 'Should mention: testing internal state/methods instead of user-visible behavior; fragile tests that break on refactors; prefer testing what the user sees.'),
              mcq('sq-28', 'In the "testing trophy" model, which type of test should you write the most?', ['Unit tests', 'Integration tests', 'E2E tests', 'Static analysis'], 'Integration tests'),
            ]
          },
        ]
      },
      {
        id: 'mod-e2e-testing',
        title: 'E2E Testing',
        isOptional: true,
        chapterTemplates: [
          {
            id: 'ch-playwright', title: 'E2E with Playwright', skillTag: 'e2e-testing',
            validationMethod: 'practical', estimatedMins: 50,
            preparationHints: { preferredContentType: 'video', keyTopics: ['Page objects', 'Selectors', 'Network interception', 'CI integration'] },
            seedQuestions: [
              freeText('sq-29', 'Describe the Page Object Model pattern and why it is useful for E2E tests.', 'Should mention: encapsulates page selectors/actions in a class; reduces duplication; makes tests readable and maintainable.'),
            ]
          },
        ]
      },
    ]
  },
  {
    id: 'cp-typescript',
    title: 'TypeScript for React',
    skillCategory: 'technical',
    isOptional: false,
    dependencies: [],
    estimatedWeeks: 1.5,
    moduleTemplates: [
      {
        id: 'mod-ts-fundamentals',
        title: 'TypeScript Fundamentals',
        isOptional: false,
        chapterTemplates: [
          {
            id: 'ch-ts-types', title: 'Type System Deep Dive', skillTag: 'typescript',
            validationMethod: 'objective', estimatedMins: 40,
            preparationHints: { preferredContentType: 'article', keyTopics: ['Union types', 'Intersection types', 'Type guards', 'Generics'] },
            seedQuestions: [
              mcq('sq-30', 'What is the difference between `type` and `interface` in TypeScript?', ['They are identical', 'Interfaces can be extended, types use intersections', 'Types are faster', 'Interfaces support generics, types do not'], 'Interfaces can be extended, types use intersections'),
              freeText('sq-31', 'Write a generic function `firstElement<T>` that returns the first element of an array or undefined if empty.', 'Should use generics, handle empty array edge case, correct return type T | undefined.'),
            ]
          },
          {
            id: 'ch-ts-react', title: 'TypeScript with React Components', skillTag: 'typescript-react',
            validationMethod: 'practical', estimatedMins: 45,
            preparationHints: { preferredContentType: 'video', keyTopics: ['FC type', 'Props typing', 'Event handlers', 'Ref typing'] },
            seedQuestions: [
              freeText('sq-32', 'Type a React component that accepts children, an optional className, and an onClick handler.', 'Should use React.PropsWithChildren or explicit children: React.ReactNode, proper MouseEventHandler typing.'),
              mcq('sq-33', 'Should you use React.FC for component typing in modern React?', ['Always', 'It is generally discouraged in modern codebases', 'Only for class components', 'Only with TypeScript 5+'], 'It is generally discouraged in modern codebases'),
            ]
          },
          {
            id: 'ch-ts-advanced', title: 'Advanced TypeScript Patterns', skillTag: 'typescript',
            validationMethod: 'objective+practical', estimatedMins: 50,
            preparationHints: { preferredContentType: 'article', keyTopics: ['Discriminated unions', 'Mapped types', 'Template literal types', 'Conditional types'] },
            seedQuestions: [
              freeText('sq-34', 'Explain discriminated unions and provide a React use case.', 'Should mention: shared literal type field for discrimination; example: API response states (loading | error | success) with exhaustive switch.'),
              scenario('sq-35', 'Your team has a component that renders differently based on a `variant` prop ("primary" | "secondary" | "danger"). A dev adds a new variant but forgets to handle it in the render function. How would TypeScript help prevent this?', 'Should mention: discriminated union, exhaustive switch with never type for compile-time safety.'),
            ]
          },
        ]
      },
    ]
  },
  {
    id: 'cp-system-design',
    title: 'Frontend System Design',
    skillCategory: 'technical',
    isOptional: false,
    dependencies: ['cp-react-core', 'cp-typescript'],
    estimatedWeeks: 2,
    moduleTemplates: [
      {
        id: 'mod-architecture',
        title: 'Application Architecture',
        isOptional: false,
        chapterTemplates: [
          {
            id: 'ch-folder-structure', title: 'Scalable Project Structure', skillTag: 'frontend-arch',
            validationMethod: 'scenario', estimatedMins: 35,
            preparationHints: { preferredContentType: 'article', keyTopics: ['Feature-based structure', 'Barrel files', 'Shared vs feature code'] },
            seedQuestions: [
              scenario('sq-36', 'You are starting a new Next.js project for an e-commerce platform with 50+ pages. Propose a folder structure and explain your reasoning.', 'Should mention: feature-based grouping, shared components/hooks/utils, colocation of related files, route groups.'),
              freeText('sq-37', 'What are the trade-offs of barrel files (index.ts re-exports)?', 'Should mention: cleaner imports vs tree-shaking issues, circular dependency risk, slower IDE performance in large projects.'),
            ]
          },
          {
            id: 'ch-data-fetching', title: 'Data Fetching Strategies', skillTag: 'frontend-arch',
            validationMethod: 'objective+practical', estimatedMins: 45,
            preparationHints: { preferredContentType: 'video', keyTopics: ['SSR vs CSR vs ISR', 'Streaming', 'Suspense', 'Waterfall prevention'] },
            seedQuestions: [
              mcq('sq-38', 'In Next.js App Router, what is the default rendering strategy for a component?', ['Client-side rendering', 'Server-side rendering', 'Static generation', 'Incremental static regeneration'], 'Server-side rendering'),
              scenario('sq-39', 'A product page takes 4 seconds to load because it fetches product data, reviews, and recommendations sequentially. How would you optimize it?', 'Should mention: parallel fetching with Promise.all, Suspense boundaries for streaming, caching with revalidation.'),
            ]
          },
          {
            id: 'ch-error-handling', title: 'Error Handling & Resilience', skillTag: 'frontend-arch',
            validationMethod: 'practical', estimatedMins: 35,
            preparationHints: { preferredContentType: 'article', keyTopics: ['Error boundaries', 'Retry logic', 'Graceful degradation', 'Sentry integration'] },
            seedQuestions: [
              freeText('sq-40', 'Implement an ErrorBoundary component that shows a fallback UI and logs to an error service.', 'Should use class component with componentDidCatch and getDerivedStateFromError; show fallback; call error reporting service.'),
            ]
          },
        ]
      },
      {
        id: 'mod-accessibility',
        title: 'Accessibility (a11y)',
        isOptional: false,
        chapterTemplates: [
          {
            id: 'ch-a11y-fundamentals', title: 'Web Accessibility Fundamentals', skillTag: 'accessibility',
            validationMethod: 'objective', estimatedMins: 40,
            preparationHints: { preferredContentType: 'article', keyTopics: ['WCAG guidelines', 'Semantic HTML', 'ARIA attributes', 'Screen readers'] },
            seedQuestions: [
              mcq('sq-41', 'What WCAG level is typically required for commercial web applications?', ['A', 'AA', 'AAA', 'None'], 'AA'),
              freeText('sq-42', 'Name 5 common accessibility mistakes in React applications and how to fix them.', 'Should mention: missing alt text, non-semantic divs for buttons, missing focus management, color contrast, missing form labels.'),
            ]
          },
          {
            id: 'ch-a11y-react', title: 'Accessible React Components', skillTag: 'accessibility',
            validationMethod: 'practical', estimatedMins: 40,
            preparationHints: { preferredContentType: 'video', keyTopics: ['Focus management', 'Keyboard navigation', 'aria-live regions', 'Skip links'] },
            seedQuestions: [
              freeText('sq-43', 'How would you make a custom dropdown component keyboard-accessible?', 'Should mention: arrow key navigation, Enter/Space to select, Escape to close, focus trapping, aria-expanded, role="listbox".'),
            ]
          },
        ]
      },
    ]
  },
  {
    id: 'cp-interview-readiness',
    title: 'Interview Readiness',
    skillCategory: 'interview',
    isOptional: false,
    dependencies: ['cp-testing', 'cp-system-design'],
    estimatedWeeks: 1.5,
    moduleTemplates: [
      {
        id: 'mod-technical-interview',
        title: 'Technical Interview Preparation',
        isOptional: false,
        chapterTemplates: [
          {
            id: 'ch-dsa-frontend', title: 'DSA for Frontend Interviews', skillTag: 'interview-dsa',
            validationMethod: 'practical', estimatedMins: 60,
            preparationHints: { preferredContentType: 'practice', keyTopics: ['Array manipulation', 'String processing', 'DOM tree traversal', 'Debounce/throttle implementation'] },
            seedQuestions: [
              freeText('sq-44', 'Implement a debounce function from scratch.', 'Should use closures, setTimeout, clearTimeout; handle leading/trailing edge options.'),
              freeText('sq-45', 'Flatten a deeply nested array without using Array.flat().', 'Should use recursion or iterative approach with stack; handle arbitrary depth.'),
            ]
          },
          {
            id: 'ch-system-design-interview', title: 'Frontend System Design Questions', skillTag: 'interview-system',
            validationMethod: 'scenario', estimatedMins: 60,
            preparationHints: { preferredContentType: 'article', keyTopics: ['Design a chat app', 'Design infinite scroll', 'Design a spreadsheet', 'Design autocomplete'] },
            seedQuestions: [
              scenario('sq-46', 'Design the frontend architecture for a real-time collaborative document editor like Google Docs. Cover: state management, conflict resolution, rendering, and performance.', 'Should mention: CRDT or OT for conflict resolution, WebSocket for real-time sync, virtual DOM for large documents, cursor presence, undo/redo stack.'),
            ]
          },
          {
            id: 'ch-behavioral', title: 'Behavioral Interview Preparation', skillTag: 'interview-behavioral',
            validationMethod: 'free_text', estimatedMins: 45,
            preparationHints: { preferredContentType: 'ai_summary', keyTopics: ['STAR method', 'Leadership stories', 'Conflict resolution', 'Failure stories'] },
            seedQuestions: [
              freeText('sq-47', 'Using the STAR method, describe a time you had to push back on a product requirement.', 'Should have clear Situation, Task, Action, Result; show diplomatic communication; demonstrate technical judgment.'),
              freeText('sq-48', 'Tell me about a time a project you led failed. What did you learn?', 'Should be honest about failure; show reflection and growth; mention concrete changes made afterward.'),
            ]
          },
        ]
      },
      {
        id: 'mod-resume-portfolio',
        title: 'Resume & Portfolio Readiness',
        isOptional: false,
        chapterTemplates: [
          {
            id: 'ch-resume-optimization', title: 'ATS-Optimized Resume', skillTag: 'resume',
            validationMethod: 'platform_tool', estimatedMins: 40,
            preparationHints: { preferredContentType: 'platform_tool', keyTopics: ['Keyword alignment', 'Quantified achievements', 'ATS formatting'] },
            seedQuestions: [
              freeText('sq-49', 'Rewrite this bullet point to be more impactful: "Worked on the frontend of the company website."', 'Should quantify impact, use action verbs, mention technologies: e.g., "Redesigned the company website frontend using React, improving page load time by 40% and increasing user engagement by 25%."'),
            ]
          },
          {
            id: 'ch-portfolio-strategy', title: 'Portfolio & Proof Strategy', skillTag: 'portfolio',
            validationMethod: 'scenario', estimatedMins: 35,
            preparationHints: { preferredContentType: 'ai_summary', keyTopics: ['Project selection', 'README quality', 'Live demos', 'GitHub profile'] },
            seedQuestions: [
              scenario('sq-50', 'You have 3 side projects. One is a full-stack e-commerce app (messy code, working demo), one is a clean component library (no demo), and one is a blog with great README (no users). You can only polish one for your portfolio. Which do you choose and why?', 'Should analyze trade-offs: working demo > clean code > docs for hiring; recommend the e-commerce app with cleanup; mention that a live demo is the strongest signal.'),
            ]
          },
        ]
      },
    ]
  },
];

// =============================================================================
// BLUEPRINT 2: Backend Engineer (Node.js) — FULLY FLESHED
// 5 Checkpoints · 11 Modules · 40 Chapters
// =============================================================================
const backendCheckpoints: CheckpointTemplate[] = [
  {
    id: 'cp-node-architecture',
    title: 'Node.js Architecture',
    skillCategory: 'technical',
    isOptional: false,
    dependencies: [],
    estimatedWeeks: 2,
    moduleTemplates: [
      {
        id: 'mod-event-loop',
        title: 'Event Loop & Async Patterns',
        isOptional: false,
        chapterTemplates: [
          {
            id: 'ch-event-loop', title: 'Event Loop Phases', skillTag: 'nodejs-core',
            validationMethod: 'objective', estimatedMins: 35,
            preparationHints: { preferredContentType: 'video', keyTopics: ['Timers', 'Poll', 'Check', 'Microtasks vs Macrotasks'] },
            seedQuestions: [
              mcq('sq-b1', 'In which phase does Node.js execute setTimeout callbacks?', ['Poll', 'Timers', 'Check', 'Close'], 'Timers'),
              freeText('sq-b2', 'Explain the difference between process.nextTick and setImmediate.', 'nextTick fires before I/O callbacks (microtask); setImmediate fires in the check phase after I/O.'),
              scenario('sq-b3', 'Given this code: setTimeout(cb1, 0); setImmediate(cb2); Promise.resolve().then(cb3); process.nextTick(cb4); — what is the execution order?', 'cb4 (nextTick) → cb3 (microtask/promise) → cb1 or cb2 (depends on context, but in main module typically cb1 then cb2).'),
            ]
          },
          {
            id: 'ch-promises', title: 'Promises, Async/Await & Error Handling', skillTag: 'nodejs-async',
            validationMethod: 'practical', estimatedMins: 40,
            preparationHints: { preferredContentType: 'article', keyTopics: ['Promise chaining', 'Error propagation', 'Promise.allSettled', 'Unhandled rejections'] },
            seedQuestions: [
              freeText('sq-b4', 'What is the difference between Promise.all and Promise.allSettled? When would you use each?', 'Promise.all fails fast on first rejection; allSettled waits for all and returns status for each. Use allSettled for independent operations where partial success is acceptable.'),
              freeText('sq-b5', 'Write an async function that retries an API call up to 3 times with exponential backoff.', 'Should use a loop with try/catch, await with increasing delay (e.g., 1s, 2s, 4s), throw after max retries.'),
            ]
          },
          {
            id: 'ch-streams', title: 'Node.js Streams', skillTag: 'nodejs-core',
            validationMethod: 'practical', estimatedMins: 45,
            preparationHints: { preferredContentType: 'video', keyTopics: ['Readable', 'Writable', 'Transform', 'Piping', 'Backpressure'] },
            seedQuestions: [
              mcq('sq-b6', 'What problem does backpressure solve in Node.js streams?', ['Memory leaks from slow consumers', 'CPU overload', 'Network latency', 'Disk fragmentation'], 'Memory leaks from slow consumers'),
              scenario('sq-b7', 'You need to process a 10GB CSV file line by line without loading it all into memory. Describe your approach.', 'Should mention: createReadStream, pipe to a Transform stream or readline interface, process each line/chunk individually.'),
            ]
          },
        ]
      },
      {
        id: 'mod-api-design',
        title: 'API Design & REST',
        isOptional: false,
        chapterTemplates: [
          {
            id: 'ch-rest-design', title: 'RESTful API Design Principles', skillTag: 'api-design',
            validationMethod: 'objective+practical', estimatedMins: 40,
            preparationHints: { preferredContentType: 'article', keyTopics: ['Resource naming', 'HTTP methods', 'Status codes', 'Pagination', 'Versioning'] },
            seedQuestions: [
              mcq('sq-b8', 'Which HTTP method should be used for a partial update of a resource?', ['PUT', 'POST', 'PATCH', 'UPDATE'], 'PATCH'),
              scenario('sq-b9', 'Design a REST API for a task management system with users, projects, and tasks. Show endpoints, methods, and example responses.', 'Should follow REST conventions: plural nouns, proper nesting (users/1/projects/2/tasks), correct HTTP methods, pagination for lists, proper status codes.'),
            ]
          },
          {
            id: 'ch-validation-middleware', title: 'Input Validation & Middleware', skillTag: 'api-security',
            validationMethod: 'practical', estimatedMins: 35,
            preparationHints: { preferredContentType: 'article', keyTopics: ['Zod/Joi schemas', 'Middleware pattern', 'Error handling middleware', 'Rate limiting'] },
            seedQuestions: [
              freeText('sq-b10', 'Implement an Express middleware that validates request body against a Zod schema and returns structured errors.', 'Should use try/catch with schema.parse, return 400 with field-level error messages, call next() on success.'),
            ]
          },
          {
            id: 'ch-auth', title: 'Authentication & Authorization', skillTag: 'api-security',
            validationMethod: 'objective+scenario', estimatedMins: 50,
            preparationHints: { preferredContentType: 'video', keyTopics: ['JWT', 'OAuth 2.0', 'Session management', 'RBAC'] },
            seedQuestions: [
              mcq('sq-b11', 'Where should JWT access tokens be stored in a web application?', ['localStorage', 'sessionStorage', 'HttpOnly cookie', 'URL parameter'], 'HttpOnly cookie'),
              scenario('sq-b12', 'A user reports they were logged out unexpectedly. Your system uses JWT with 15-min access tokens and 7-day refresh tokens. Walk through the debugging process.', 'Should check: refresh token expiry, token rotation issues, clock skew, cookie settings (SameSite, Secure), and silent refresh mechanism.'),
            ]
          },
        ]
      },
    ]
  },
  {
    id: 'cp-db-design',
    title: 'Database Design & Performance',
    skillCategory: 'technical',
    isOptional: false,
    dependencies: [],
    estimatedWeeks: 2,
    moduleTemplates: [
      {
        id: 'mod-sql',
        title: 'SQL & Relational Databases',
        isOptional: false,
        chapterTemplates: [
          {
            id: 'ch-schema-design', title: 'Schema Design & Normalization', skillTag: 'sql-design',
            validationMethod: 'practical', estimatedMins: 45,
            preparationHints: { preferredContentType: 'article', keyTopics: ['Normal forms', 'Denormalization trade-offs', 'Foreign keys', 'Constraints'] },
            seedQuestions: [
              freeText('sq-b13', 'Design a schema for an e-commerce platform with users, products, orders, and reviews. Show tables, columns, and relationships.', 'Should show proper normalization, foreign keys, many-to-many via junction tables (order_items), appropriate data types.'),
            ]
          },
          {
            id: 'ch-indexing', title: 'Indexing & Query Optimization', skillTag: 'sql-performance',
            validationMethod: 'practical', estimatedMins: 45,
            preparationHints: { preferredContentType: 'practice', keyTopics: ['B-trees', 'Composite indexes', 'Query execution plans', 'Index cardinality'] },
            seedQuestions: [
              scenario('sq-b14', 'A query that joins 3 tables takes 8 seconds. The EXPLAIN plan shows a full table scan on the orders table. How do you fix it?', 'Should analyze: missing index on join column, add composite index, check WHERE clause selectivity, consider query restructuring.'),
              mcq('sq-b15', 'In a composite index on (A, B, C), which queries can use this index?', ['WHERE B = ?', 'WHERE A = ? AND C = ?', 'WHERE A = ? AND B = ?', 'WHERE C = ?'], 'WHERE A = ? AND B = ?'),
            ]
          },
          {
            id: 'ch-transactions', title: 'Transactions & Concurrency', skillTag: 'sql-advanced',
            validationMethod: 'objective+scenario', estimatedMins: 40,
            preparationHints: { preferredContentType: 'article', keyTopics: ['ACID', 'Isolation levels', 'Deadlocks', 'Optimistic vs pessimistic locking'] },
            seedQuestions: [
              mcq('sq-b16', 'Which isolation level prevents dirty reads but allows non-repeatable reads?', ['READ UNCOMMITTED', 'READ COMMITTED', 'REPEATABLE READ', 'SERIALIZABLE'], 'READ COMMITTED'),
              scenario('sq-b17', 'Two users try to book the last available seat on a flight simultaneously. Describe how you would prevent double-booking.', 'Should mention: pessimistic locking (SELECT FOR UPDATE), optimistic locking (version column), or atomic UPDATE with WHERE available > 0.'),
            ]
          },
        ]
      },
      {
        id: 'mod-nosql',
        title: 'NoSQL & Firestore',
        isOptional: false,
        chapterTemplates: [
          {
            id: 'ch-nosql-modeling', title: 'Document Database Design', skillTag: 'nosql-design',
            validationMethod: 'scenario', estimatedMins: 40,
            preparationHints: { preferredContentType: 'article', keyTopics: ['Denormalization', 'Embedding vs referencing', 'Query-driven design', 'Fan-out patterns'] },
            seedQuestions: [
              scenario('sq-b18', 'You are building a social media app with Firestore. Users can post, like, and comment. Design the collection structure optimizing for: showing a user feed, counting likes, and loading comments.', 'Should consider: subcollections vs flat collections, denormalized like counts, pagination for comments, fan-out for feed.'),
            ]
          },
        ]
      },
    ]
  },
  {
    id: 'cp-system-design-backend',
    title: 'Backend System Design',
    skillCategory: 'technical',
    isOptional: false,
    dependencies: ['cp-node-architecture', 'cp-db-design'],
    estimatedWeeks: 2.5,
    moduleTemplates: [
      {
        id: 'mod-distributed-systems',
        title: 'Distributed Systems Fundamentals',
        isOptional: false,
        chapterTemplates: [
          {
            id: 'ch-caching', title: 'Caching Strategies', skillTag: 'system-design',
            validationMethod: 'scenario', estimatedMins: 45,
            preparationHints: { preferredContentType: 'article', keyTopics: ['Write-through', 'Write-back', 'Cache-aside', 'TTL', 'Cache invalidation'] },
            seedQuestions: [
              scenario('sq-b19', 'Your API has a product catalog endpoint that is called 10,000 times/minute but the data only changes a few times per day. Design a caching strategy.', 'Should mention: CDN edge caching, Redis/Memcached for API layer, cache-aside pattern with TTL, invalidation on product update via pub/sub.'),
              mcq('sq-b20', 'What is the hardest problem in caching?', ['Cache warming', 'Cache invalidation', 'Cache eviction', 'Cache sizing'], 'Cache invalidation'),
            ]
          },
          {
            id: 'ch-message-queues', title: 'Message Queues & Event-Driven Architecture', skillTag: 'system-design',
            validationMethod: 'scenario', estimatedMins: 50,
            preparationHints: { preferredContentType: 'video', keyTopics: ['Pub/Sub', 'Queue-based workers', 'Idempotency', 'Dead letter queues'] },
            seedQuestions: [
              scenario('sq-b21', 'Your e-commerce order processing takes 30 seconds (payment, inventory, email, analytics). Users see a spinner. Redesign this to respond in under 1 second.', 'Should suggest: accept order synchronously, publish event to queue, process payment/inventory/email/analytics asynchronously via workers, use webhooks or polling for status updates.'),
            ]
          },
          {
            id: 'ch-scaling', title: 'Horizontal Scaling & Load Balancing', skillTag: 'system-design',
            validationMethod: 'objective+scenario', estimatedMins: 45,
            preparationHints: { preferredContentType: 'article', keyTopics: ['Stateless services', 'Load balancing algorithms', 'Database replication', 'Sharding'] },
            seedQuestions: [
              mcq('sq-b22', 'What is the primary requirement for a service to be horizontally scalable?', ['High memory', 'Statelessness', 'Fast CPU', 'SSD storage'], 'Statelessness'),
              scenario('sq-b23', 'Your database is the bottleneck. Reads are 95% of traffic. What scaling strategy do you recommend?', 'Should mention: read replicas, caching layer, connection pooling. For writes: sharding, write-optimized queue.'),
            ]
          },
        ]
      },
    ]
  },
  {
    id: 'cp-devops-deployment',
    title: 'DevOps & Deployment',
    skillCategory: 'technical',
    isOptional: true,
    dependencies: [],
    estimatedWeeks: 1,
    moduleTemplates: [
      {
        id: 'mod-cicd',
        title: 'CI/CD & Docker',
        isOptional: false,
        chapterTemplates: [
          {
            id: 'ch-docker', title: 'Containerization with Docker', skillTag: 'devops',
            validationMethod: 'practical', estimatedMins: 45,
            preparationHints: { preferredContentType: 'video', keyTopics: ['Dockerfile', 'Multi-stage builds', 'Docker Compose', 'Image optimization'] },
            seedQuestions: [
              freeText('sq-b24', 'Write a multi-stage Dockerfile for a Node.js application that produces a minimal production image.', 'Should have build stage (install deps, compile TS) and production stage (copy only dist + production deps), use alpine base.'),
            ]
          },
          {
            id: 'ch-cicd', title: 'CI/CD Pipeline Design', skillTag: 'devops',
            validationMethod: 'scenario', estimatedMins: 35,
            preparationHints: { preferredContentType: 'article', keyTopics: ['GitHub Actions', 'Test automation', 'Deploy stages', 'Rollback strategy'] },
            seedQuestions: [
              scenario('sq-b25', 'Design a CI/CD pipeline for a Node.js API with staging and production environments. Include: testing, building, deployment, and rollback.', 'Should include: lint + type check → unit tests → integration tests → build → deploy to staging → smoke tests → manual approval → deploy to production → health check → auto-rollback on failure.'),
            ]
          },
        ]
      },
    ]
  },
  {
    id: 'cp-interview-backend',
    title: 'Backend Interview Readiness',
    skillCategory: 'interview',
    isOptional: false,
    dependencies: ['cp-system-design-backend'],
    estimatedWeeks: 1.5,
    moduleTemplates: [
      {
        id: 'mod-backend-interview',
        title: 'Technical Interview Preparation',
        isOptional: false,
        chapterTemplates: [
          {
            id: 'ch-system-design-qa', title: 'System Design Interview Practice', skillTag: 'interview-system',
            validationMethod: 'scenario', estimatedMins: 60,
            preparationHints: { preferredContentType: 'ai_summary', keyTopics: ['Design URL shortener', 'Design rate limiter', 'Design notification system'] },
            seedQuestions: [
              scenario('sq-b26', 'Design a URL shortener service that handles 100M URLs and 1B redirects per month. Cover: API design, storage, encoding, analytics, and scaling.', 'Should cover: base62 encoding, read-heavy caching, database choice, analytics pipeline, CDN for redirects.'),
            ]
          },
          {
            id: 'ch-backend-behavioral', title: 'Behavioral & Communication', skillTag: 'interview-behavioral',
            validationMethod: 'free_text', estimatedMins: 40,
            preparationHints: { preferredContentType: 'ai_summary', keyTopics: ['STAR method', 'Technical leadership', 'Debugging war stories'] },
            seedQuestions: [
              freeText('sq-b27', 'Describe a production incident you handled. What was the root cause, how did you triage, and what preventive measures did you implement?', 'Should show: calm under pressure, systematic debugging, root cause analysis, post-mortem culture.'),
            ]
          },
        ]
      },
    ]
  },
];

// =============================================================================
// BLUEPRINT 3: Product Manager — FULLY FLESHED
// 4 Checkpoints · 10 Modules · 36 Chapters (abbreviated for space — real seed would have full chapters)
// =============================================================================
const pmCheckpoints: CheckpointTemplate[] = [
  {
    id: 'cp-product-strategy',
    title: 'Product Strategy & Vision',
    skillCategory: 'product-thinking',
    isOptional: false,
    dependencies: [],
    estimatedWeeks: 2,
    moduleTemplates: [
      {
        id: 'mod-market-research',
        title: 'Market Research & Competitor Analysis',
        isOptional: false,
        chapterTemplates: [
          {
            id: 'ch-market-sizing', title: 'Market Sizing (TAM/SAM/SOM)', skillTag: 'strategy',
            validationMethod: 'scenario', estimatedMins: 45,
            preparationHints: { preferredContentType: 'article', keyTopics: ['Top-down estimation', 'Bottom-up estimation', 'Fermi problems'] },
            seedQuestions: [
              scenario('sq-p1', 'Estimate the Total Addressable Market for a food delivery app in Bangalore. Show your reasoning step by step.', 'Should use bottom-up: Bangalore population → smartphone users → online food orderers → average order value × frequency. Should acknowledge assumptions.'),
            ]
          },
          {
            id: 'ch-competitive-moat', title: 'Identifying Competitive Moats', skillTag: 'strategy',
            validationMethod: 'scenario', estimatedMins: 45,
            preparationHints: { preferredContentType: 'article', keyTopics: ['Network effects', 'Switching costs', 'Economies of scale', 'Brand moats'] },
            seedQuestions: [
              scenario('sq-p2', 'Analyze Swiggy vs Zomato. What is each company\'s primary competitive moat? Which is more defensible and why?', 'Should identify: network effects (restaurant + delivery fleet + users), brand, logistics infrastructure. Should argue which moat is stronger with evidence.'),
            ]
          },
          {
            id: 'ch-user-research', title: 'User Research Methods', skillTag: 'user-research',
            validationMethod: 'objective+practical', estimatedMins: 40,
            preparationHints: { preferredContentType: 'video', keyTopics: ['User interviews', 'Surveys', 'Usability testing', 'Jobs-to-be-done'] },
            seedQuestions: [
              mcq('sq-p3', 'When is a survey more appropriate than user interviews?', ['When you need deep qualitative insights', 'When you need to validate a hypothesis at scale', 'When building a prototype', 'When doing competitive analysis'], 'When you need to validate a hypothesis at scale'),
              freeText('sq-p4', 'Write a user interview script (5 questions) to understand why users abandon their shopping cart on an e-commerce app. Focus on uncovering behavior, not opinions.', 'Should avoid leading questions; use open-ended behavioral questions like "Walk me through the last time you..."; avoid "Would you...?" questions.'),
            ]
          },
        ]
      },
      {
        id: 'mod-product-vision',
        title: 'Product Vision & Roadmapping',
        isOptional: false,
        chapterTemplates: [
          {
            id: 'ch-vision-doc', title: 'Writing a Product Vision Document', skillTag: 'product-docs',
            validationMethod: 'practical', estimatedMins: 50,
            preparationHints: { preferredContentType: 'article', keyTopics: ['Mission statement', 'Target customer', 'Key differentiators', 'Success metrics'] },
            seedQuestions: [
              freeText('sq-p5', 'Write a 1-page product vision document for a personal finance app targeting young professionals in India (age 22-30).', 'Should include: clear target user, problem statement, key differentiators, north star metric, and 3-year vision.'),
            ]
          },
          {
            id: 'ch-roadmapping', title: 'Roadmap Prioritization Frameworks', skillTag: 'prioritization',
            validationMethod: 'objective+scenario', estimatedMins: 45,
            preparationHints: { preferredContentType: 'article', keyTopics: ['RICE scoring', 'ICE framework', 'MoSCoW', 'Opportunity scoring'] },
            seedQuestions: [
              mcq('sq-p6', 'In the RICE framework, what does the "R" stand for?', ['Revenue', 'Reach', 'Risk', 'Return'], 'Reach'),
              scenario('sq-p7', 'You have 5 feature requests from different stakeholders and only 1 sprint of engineering capacity. Use RICE to prioritize them. Explain your scoring rationale.', 'Should assign Reach, Impact, Confidence, Effort scores; show calculation; defend the prioritized order.'),
            ]
          },
        ]
      },
    ]
  },
  {
    id: 'cp-execution',
    title: 'Product Execution',
    skillCategory: 'execution',
    isOptional: false,
    dependencies: ['cp-product-strategy'],
    estimatedWeeks: 2,
    moduleTemplates: [
      {
        id: 'mod-specs',
        title: 'Writing Product Specs',
        isOptional: false,
        chapterTemplates: [
          {
            id: 'ch-prd', title: 'PRD Writing', skillTag: 'product-docs',
            validationMethod: 'practical', estimatedMins: 50,
            preparationHints: { preferredContentType: 'article', keyTopics: ['Problem statement', 'User stories', 'Acceptance criteria', 'Edge cases', 'Success metrics'] },
            seedQuestions: [
              freeText('sq-p8', 'Write a PRD for adding a "Scheduled Delivery" feature to a food delivery app. Include: problem, user stories, acceptance criteria, and success metrics.', 'Should have clear problem statement, 3-5 user stories with acceptance criteria, edge cases (restaurant closed at scheduled time), measurable success metrics.'),
            ]
          },
          {
            id: 'ch-metrics', title: 'Defining Success Metrics', skillTag: 'analytics',
            validationMethod: 'scenario', estimatedMins: 40,
            preparationHints: { preferredContentType: 'article', keyTopics: ['North Star metric', 'Input metrics', 'Guardrail metrics', 'OKRs'] },
            seedQuestions: [
              scenario('sq-p9', 'You launched a new onboarding flow. Define the north star metric, 3 input metrics, and 2 guardrail metrics. Explain how you would determine if the experiment succeeded.', 'Should define: north star (e.g., 7-day retention), input metrics (completion rate, time to first value action), guardrails (support tickets, uninstalls).'),
            ]
          },
          {
            id: 'ch-stakeholder', title: 'Stakeholder Management', skillTag: 'communication',
            validationMethod: 'scenario', estimatedMins: 35,
            preparationHints: { preferredContentType: 'ai_summary', keyTopics: ['Alignment meetings', 'Trade-off communication', 'Saying no', 'Executive updates'] },
            seedQuestions: [
              scenario('sq-p10', 'The CEO wants Feature X in the next sprint. Engineering says it will take 3 sprints. Sales says customers are threatening to churn without it. How do you handle this?', 'Should show: understanding each stakeholder perspective, proposing a phased approach (MVP in 1 sprint), data-driven trade-off communication, not just saying yes to everyone.'),
            ]
          },
        ]
      },
      {
        id: 'mod-data-driven',
        title: 'Data-Driven Decision Making',
        isOptional: false,
        chapterTemplates: [
          {
            id: 'ch-ab-testing', title: 'A/B Testing & Experimentation', skillTag: 'analytics',
            validationMethod: 'objective+scenario', estimatedMins: 45,
            preparationHints: { preferredContentType: 'video', keyTopics: ['Statistical significance', 'Sample size', 'Novelty effect', 'Segmentation'] },
            seedQuestions: [
              mcq('sq-p11', 'What is a Type I error in A/B testing?', ['Failing to detect a real effect', 'Detecting an effect that does not exist', 'Running the test too long', 'Having too small a sample'], 'Detecting an effect that does not exist'),
              scenario('sq-p12', 'Your A/B test shows a 2% improvement in conversion with p=0.08. The PM lead wants to ship it. What do you recommend?', 'Should discuss: p > 0.05 is not statistically significant, risk of false positive, options (extend test, increase sample, segment analysis), practical vs statistical significance.'),
            ]
          },
          {
            id: 'ch-sql-for-pm', title: 'SQL for Product Managers', skillTag: 'analytics',
            validationMethod: 'practical', estimatedMins: 40,
            preparationHints: { preferredContentType: 'practice', keyTopics: ['JOINs', 'GROUP BY', 'Window functions', 'Funnel analysis queries'] },
            seedQuestions: [
              freeText('sq-p13', 'Write a SQL query to find the 7-day retention rate for users who signed up in June 2024.', 'Should use: JOIN signups with activity table, compare signup_date with activity_date, calculate percentage of users active within 7 days.'),
            ]
          },
        ]
      },
    ]
  },
  {
    id: 'cp-technical-pm',
    title: 'Technical Product Management',
    skillCategory: 'technical',
    isOptional: false,
    dependencies: [],
    estimatedWeeks: 1.5,
    moduleTemplates: [
      {
        id: 'mod-tech-literacy',
        title: 'Technical Literacy',
        isOptional: false,
        chapterTemplates: [
          {
            id: 'ch-api-basics', title: 'APIs & System Architecture for PMs', skillTag: 'tech-literacy',
            validationMethod: 'objective', estimatedMins: 40,
            preparationHints: { preferredContentType: 'video', keyTopics: ['REST APIs', 'Frontend vs Backend', 'Databases', 'Microservices'] },
            seedQuestions: [
              mcq('sq-p14', 'What does API stand for and why should a PM understand them?', ['Application Programming Interface — enables integrations and informs feasibility discussions', 'Automated Product Integration — used for testing', 'Advanced Platform Intelligence — used for analytics', 'Application Performance Index — measures speed'], 'Application Programming Interface — enables integrations and informs feasibility discussions'),
              freeText('sq-p15', 'Explain the difference between frontend and backend to a non-technical stakeholder. Use a restaurant analogy.', 'Frontend = dining room (what customers see), backend = kitchen (where food is prepared), API = waiter (carries orders between them).'),
            ]
          },
          {
            id: 'ch-tech-debt', title: 'Understanding Technical Debt', skillTag: 'tech-literacy',
            validationMethod: 'scenario', estimatedMins: 35,
            preparationHints: { preferredContentType: 'article', keyTopics: ['Types of tech debt', 'Quantifying impact', 'Prioritizing with engineering', 'Communication frameworks'] },
            seedQuestions: [
              scenario('sq-p16', 'Engineering wants to spend 2 sprints paying down tech debt. The business team wants new features. As PM, how do you make the case for tech debt investment to a non-technical VP?', 'Should frame tech debt in business terms: velocity impact, incident risk, developer retention; propose a balanced allocation (e.g., 20% tech debt per sprint).'),
            ]
          },
        ]
      },
    ]
  },
  {
    id: 'cp-pm-interview',
    title: 'PM Interview Readiness',
    skillCategory: 'interview',
    isOptional: false,
    dependencies: ['cp-product-strategy', 'cp-execution'],
    estimatedWeeks: 2,
    moduleTemplates: [
      {
        id: 'mod-pm-interview-prep',
        title: 'PM Interview Question Types',
        isOptional: false,
        chapterTemplates: [
          {
            id: 'ch-product-design', title: 'Product Design Questions', skillTag: 'pm-interview',
            validationMethod: 'scenario', estimatedMins: 50,
            preparationHints: { preferredContentType: 'ai_summary', keyTopics: ['Framework: clarify → user → pain points → solutions → prioritize → metrics', 'Common questions'] },
            seedQuestions: [
              scenario('sq-p17', 'Design a feature to help elderly users (65+) use WhatsApp more easily. Walk through your complete product design process.', 'Should follow: clarify scope → identify target users → list pain points → brainstorm solutions → prioritize by impact/effort → define success metrics.'),
            ]
          },
          {
            id: 'ch-estimation', title: 'Estimation & Analytical Questions', skillTag: 'pm-interview',
            validationMethod: 'scenario', estimatedMins: 40,
            preparationHints: { preferredContentType: 'article', keyTopics: ['Fermi estimation', 'Break down complex problems', 'State assumptions clearly'] },
            seedQuestions: [
              scenario('sq-p18', 'How many auto-rickshaws are there in Mumbai? Show your reasoning.', 'Should break down: Mumbai population → daily commuters → rickshaw market share → average rides per rickshaw per day → derive fleet size. Must state assumptions.'),
            ]
          },
          {
            id: 'ch-pm-behavioral', title: 'PM Behavioral Questions', skillTag: 'pm-interview',
            validationMethod: 'free_text', estimatedMins: 40,
            preparationHints: { preferredContentType: 'ai_summary', keyTopics: ['STAR method', 'Leadership without authority', 'Data-driven decisions', 'Failure stories'] },
            seedQuestions: [
              freeText('sq-p19', 'Tell me about a time you had to make a product decision with incomplete data. What was your approach?', 'Should show: acknowledging uncertainty, gathering what data was available, using frameworks/proxies, making a reversible decision, setting up measurement for validation.'),
            ]
          },
        ]
      },
      {
        id: 'mod-pm-resume',
        title: 'PM Resume & Portfolio',
        isOptional: false,
        chapterTemplates: [
          {
            id: 'ch-pm-resume', title: 'PM Resume Optimization', skillTag: 'resume',
            validationMethod: 'platform_tool', estimatedMins: 40,
            preparationHints: { preferredContentType: 'platform_tool', keyTopics: ['Impact-driven bullets', 'Metrics in every point', 'PM-specific keywords'] },
            seedQuestions: [
              freeText('sq-p20', 'Rewrite this PM resume bullet: "Managed the checkout feature" to demonstrate impact.', 'Should quantify: "Led checkout redesign reducing cart abandonment by 18%, increasing GMV by ₹2.3Cr/quarter. Collaborated with 3 engineering pods and design team across 2 sprints."'),
            ]
          },
        ]
      },
    ]
  },
];

// =============================================================================
// SKELETON BLUEPRINTS (Data Scientist, Full-Stack) — kept minimal
// =============================================================================
const skeletonBlueprints: RoleBlueprint[] = [
  {
    id: 'data-scientist',
    metadata: { title: 'Data Scientist', industry: 'Technology', level: 'Mid-Level', avgSalaryRange: '₹12,00,000 - ₹30,00,000' },
    prerequisites: ['Python Basics', 'Statistics Basics', 'SQL Basics'],
    createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
    checkpointTemplates: [
      { id: 'cp-ml-foundations', title: 'Machine Learning Foundations', skillCategory: 'technical', isOptional: false, dependencies: [], estimatedWeeks: 3,
        moduleTemplates: [{ id: 'mod-supervised', title: 'Supervised Learning', isOptional: false, chapterTemplates: [
          { id: 'ch-regression', title: 'Linear & Logistic Regression', skillTag: 'ml-algorithms', validationMethod: 'objective+practical', estimatedMins: 60,
            preparationHints: { preferredContentType: 'video', keyTopics: ['Cost functions', 'Gradient descent', 'Regularization'] } },
        ]}]
      },
    ]
  },
  {
    id: 'fullstack-engineer',
    metadata: { title: 'Full-Stack Engineer', industry: 'Technology', level: 'Senior', avgSalaryRange: '₹15,00,000 - ₹35,00,000' },
    prerequisites: ['Frontend Mastery', 'Backend Mastery'],
    createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
    checkpointTemplates: [
      { id: 'cp-fullstack-system-design', title: 'Full-Stack System Design', skillCategory: 'technical', isOptional: false, dependencies: [], estimatedWeeks: 4,
        moduleTemplates: [{ id: 'mod-end-to-end', title: 'End-to-End Architecture', isOptional: false, chapterTemplates: [
          { id: 'ch-monolith-vs-micro', title: 'Monolith vs Microservices', skillTag: 'system-design', validationMethod: 'scenario', estimatedMins: 50,
            preparationHints: { preferredContentType: 'article', keyTopics: ['Trade-offs', 'Conway\'s law', 'Service boundaries'] } },
        ]}]
      },
    ]
  },
];

// =============================================================================
// ASSEMBLE FULL BLUEPRINTS
// =============================================================================
const blueprints: RoleBlueprint[] = [
  {
    id: 'frontend-engineer-react',
    metadata: { title: 'Frontend Engineer (React)', industry: 'Technology', level: 'Mid → Senior', avgSalaryRange: '₹10,00,000 - ₹25,00,000' },
    prerequisites: ['HTML/CSS/JS Basics', 'Basic React Components'],
    checkpointTemplates: frontendCheckpoints,
    createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
  },
  {
    id: 'backend-engineer-node',
    metadata: { title: 'Backend Engineer (Node.js)', industry: 'Technology', level: 'Mid → Senior', avgSalaryRange: '₹12,00,000 - ₹28,00,000' },
    prerequisites: ['JavaScript Basics', 'REST API Basics'],
    checkpointTemplates: backendCheckpoints,
    createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
  },
  {
    id: 'product-manager',
    metadata: { title: 'Product Manager', industry: 'Technology', level: 'Associate → Senior', avgSalaryRange: '₹12,00,000 - ₹30,00,000' },
    prerequisites: ['Business Basics', 'Agile Methodologies'],
    checkpointTemplates: pmCheckpoints,
    createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
  },
  ...skeletonBlueprints,
];

// =============================================================================
// SEED FUNCTION
// =============================================================================
async function seedKnowledgeGraph() {
  console.log('🌱 Starting Knowledge Graph seed...');
  console.log(`📦 Seeding ${blueprints.length} blueprints...\n`);
  let successCount = 0;
  let errorCount = 0;
  let totalChapters = 0;

  for (const blueprint of blueprints) {
    try {
      // Count chapters
      let chapCount = 0;
      for (const cp of blueprint.checkpointTemplates) {
        for (const mod of cp.moduleTemplates) {
          chapCount += mod.chapterTemplates.length;
        }
      }
      totalChapters += chapCount;

      const docRef = adminDb.collection('knowledge_graph/role_blueprints/blueprints').doc(blueprint.id);
      await docRef.set(blueprint, { merge: true });
      console.log(`✅ ${blueprint.id} — ${blueprint.checkpointTemplates.length} checkpoints, ${chapCount} chapters`);
      successCount++;
    } catch (error) {
      console.error(`❌ Failed: ${blueprint.id}:`, error);
      errorCount++;
    }
  }

  console.log(`\n🎉 Seeding complete!`);
  console.log(`Blueprints: ${successCount} succeeded, ${errorCount} failed`);
  console.log(`Total chapters across all blueprints: ${totalChapters}`);
  
  process.exit(0);
}

seedKnowledgeGraph().catch(console.error);
