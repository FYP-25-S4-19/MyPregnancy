# Reusable Thread Screens

This directory contains reusable screen components that can be used across all actor roles (Mother, Doctor, Nutritionist) for community thread functionality.

## Components

### ThreadScreen

A fully-featured thread detail screen with comments, likes, and real-time updates.

**Location:** `src/screens/ThreadScreen.tsx`

**Features:**
- Display thread title, content, and metadata
- Like/unlike threads
- View all comments
- Like/unlike comments
- Add new comments
- Real-time updates via TanStack Query
- Loading and error states
- Keyboard-aware layout

**Props:**

```typescript
interface ThreadScreenProps {
  threadId: number;           // Required: The ID of the thread to display
  onBack?: () => void;        // Optional: Custom back handler
  showBackButton?: boolean;   // Optional: Show/hide back button (default: true)
  backgroundColor?: string;   // Optional: Screen background color (default: "#FFE8E8")
}
```

**Usage Example:**

```tsx
// Simple usage
import ThreadScreen from "@/src/screens/ThreadScreen";

export default function MyThreadPage() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <ThreadScreen threadId={parseInt(id)} />;
}

// With customization
export default function DoctorThreadPage() {
  const { id } = useLocalSearchParams<{ id: string }>();
  
  return (
    <ThreadScreen 
      threadId={parseInt(id)}
      backgroundColor="#E8F5FF"
      onBack={() => router.push("/doctor/home")}
    />
  );
}
```

---

### AllThreadsScreen

A comprehensive thread listing screen with search, filtering, and sorting capabilities.

**Location:** `src/screens/AllThreadsScreen.tsx`

**Features:**
- Search threads by title/content
- Filter by category (Nutrition, Sleep, Postpartum, Care, etc.)
- Sort by Latest or Popular
- Real-time like counts
- Loading and error states with retry
- Empty state handling

**Props:**

```typescript
interface AllThreadsScreenProps {
  onBack?: () => void;                    // Optional: Custom back handler
  onThreadPress?: (threadId: number) => void;  // Optional: Custom thread press handler
  showBackButton?: boolean;               // Optional: Show/hide back button (default: true)
  backgroundColor?: string;               // Optional: Screen background color (default: white)
  searchBarColor?: string;                // Optional: Search bar background color (default: "#FFD6D9")
  filterOptions?: FilterOption[];         // Optional: Custom filter categories
  title?: string;                         // Optional: Screen title (default: "Community Threads")
}

type FilterOption = "All" | "Nutrition" | "Sleep" | "Postpartum" | "Care";
```

**Usage Example:**

```tsx
// Simple usage
import AllThreadsScreen from "@/src/screens/AllThreadsScreen";

export default function MotherAllThreadsPage() {
  return <AllThreadsScreen />;
}

// With customization
export default function DoctorAllThreadsPage() {
  return (
    <AllThreadsScreen
      title="Medical Discussions"
      backgroundColor="#F5F5F5"
      searchBarColor="#E8F5FF"
      filterOptions={["All", "Prenatal", "Postpartum", "Emergency"]}
      onThreadPress={(id) => router.push(`/doctor/threads/${id}`)}
    />
  );
}

// Without back button (for main navigation)
export default function NutritionistCommunityTab() {
  return (
    <AllThreadsScreen
      showBackButton={false}
      title="Nutrition Forum"
    />
  );
}
```

---

## Global Styles

Thread-specific styles are centralized in `src/shared/globalStyles.tsx` under the `threadStyles` export.

**Available Styles:**
- `threadCard` - Main thread container
- `threadTitle` - Thread title text
- `threadContent` - Thread body content
- `threadMeta` - Metadata row (author, category, time)
- `threadActions` - Like/comment action buttons
- `commentCard` - Individual comment container
- `commentHeader` - Comment author and timestamp
- `commentContent` - Comment text
- `inputContainer` - Comment input section
- `sendButton` - Submit comment button
- And many more...

**Usage:**

```tsx
import { threadStyles } from "@/src/shared/globalStyles";

<View style={threadStyles.threadCard}>
  <Text style={threadStyles.threadTitle}>My Thread Title</Text>
</View>
```

---

## Benefits of Reusability

1. **Consistency**: All actors see the same UI/UX for threads
2. **Maintainability**: Update once, changes apply everywhere
3. **Customization**: Props allow per-role customization when needed
4. **Testing