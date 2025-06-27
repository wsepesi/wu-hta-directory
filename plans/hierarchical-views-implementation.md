# Hierarchical Data Views Implementation Plan

## Overview
Implement 4 hierarchical data views with header/subitem structure, mini profiles, and navigation to full detail pages.

## Target Views

### 1. By HTA View (`/views/by-hta`)
```
[HTA Name + Mini Profile] → [Full HTA Page]
├── Course A - Fall 2024
├── Course B - Spring 2024  
└── Course C - Fall 2023
```

### 2. By Course View (`/views/by-course`)
```
[Course Name + Mini Course Info] → [Full Course Page]
├── Fall 2024 - Prof Smith - John Doe
├── Spring 2024 - Prof Jones - Jane Smith
└── Fall 2023 - Prof Brown - Bob Wilson
```

### 3. By Timeline View (`/views/by-timeline`)
```
[Semester + Mini Semester Stats] → [Full Semester Page]
├── CS101 - John Doe
├── CS201 - Jane Smith
└── CS301 - Bob Wilson
```

### 4. By Professor View (`/views/by-professor`)
```
[Prof Name + Mini Prof Info] → [Full Professor Page]
├── CS101 - Fall 2024 - John Doe
├── CS201 - Spring 2024 - Jane Smith
└── CS301 - Fall 2023 - Bob Wilson
```

## Component Architecture

### Core Components

#### 1. `HierarchicalView` (Base Component)
```typescript
interface HierarchicalViewProps<T, S> {
  title: string;
  data: T[];
  renderHeader: (item: T) => React.ReactNode;
  renderSubitems: (item: T) => S[];
  renderSubitem: (subitem: S) => React.ReactNode;
  getHeaderLink: (item: T) => string;
}
```

#### 2. Header Components (Mini Profiles)
- `HTAMiniProfile` - Name, photo, year, major, key stats
- `CourseMiniProfile` - Code, name, professor, enrollment stats  
- `SemesterMiniProfile` - Name, course count, TA count, coverage %
- `ProfessorMiniProfile` - Name, photo, department, active courses

#### 3. Subitem Components
- `CourseAssignmentItem` - Course + semester, clickable
- `TAAssignmentItem` - Semester + professor + HTA, all clickable
- `CourseHTAItem` - Course + HTA, both clickable
- `FullAssignmentItem` - Course + semester + HTA, all clickable

#### 4. Navigation Components
- `ViewToggle` - Switch between 4 hierarchical views
- `FullDetailsArrow` - Small arrow/link to full page
- `MiniToFullNavigation` - Breadcrumb or back navigation

## Page Structure

### Hierarchical View Pages
```
/app/views/
├── by-hta/page.tsx          # HTAs → Course/Semester pairs
├── by-course/page.tsx       # Courses → Semester/Prof/HTA triplets  
├── by-timeline/page.tsx     # Semesters → Course/HTA pairs
├── by-professor/page.tsx    # Professors → Course/Semester/HTA triplets
└── layout.tsx               # Shared view switcher navigation
```

### Enhanced Individual Pages (Full Details)
```
/app/people/[userId]/page.tsx      # Full HTA details
/app/courses/[courseId]/page.tsx   # Full course details  
/app/semesters/[semester]/page.tsx # Full semester details
/app/professors/[profId]/page.tsx  # Full professor details
```

## Data Flow & Repository Usage

### 1. By HTA View Data
```typescript
// Use existing UserRepository.findWithRelations()
const htasWithAssignments = await UserRepository.findAllWithRelations();
// Group by HTA, flatten assignments to course/semester pairs
```

### 2. By Course View Data  
```typescript
// Use existing CourseRepository.findWithRelations()
const coursesWithOfferings = await CourseRepository.findAllWithRelations();
// Group by course, flatten to semester/prof/HTA triplets
```

### 3. By Timeline View Data
```typescript
// Use existing CourseOfferingRepository.findAllWithRelations()
const offeringsBySemester = await CourseOfferingRepository.findAllWithRelations();
// Group by semester, flatten to course/HTA pairs
```

### 4. By Professor View Data
```typescript
// Use existing CourseOfferingRepository.findWithRelationsByProfessorId()
const professorOfferings = await Promise.all(
  professors.map(prof => CourseOfferingRepository.findWithRelationsByProfessorId(prof.id))
);
// Group by professor, flatten to course/semester/HTA triplets
```

## UI/UX Design Patterns

### Header Design
```typescript
// Example HTA Mini Profile Header
<div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
  <div className="flex items-center space-x-4">
    <Image src={hta.imageUrl} className="w-12 h-12 rounded-full" />
    <div>
      <h3 className="font-semibold">{hta.name}</h3>
      <p className="text-sm text-gray-600">{hta.major} • {hta.graduationYear}</p>
    </div>
  </div>
  <Link href={`/people/${hta.id}`} className="text-blue-600 hover:text-blue-800">
    <ArrowRight className="w-5 h-5" />
  </Link>
</div>
```

### Subitem Design
```typescript
// Example Course Assignment Subitem
<div className="flex items-center justify-between p-2 hover:bg-gray-50 rounded">
  <div className="flex items-center space-x-3">
    <div className="w-2 h-2 bg-blue-500 rounded-full" />
    <Link href={`/courses/${courseId}`} className="font-medium hover:text-blue-600">
      {courseCode} {courseName}
    </Link>
    <span className="text-gray-500">•</span>
    <Link href={`/semesters/${semester}`} className="text-gray-600 hover:text-blue-600">
      {semester}
    </Link>
  </div>
</div>
```

### View Navigation
```typescript
// View Toggle Component
<div className="flex space-x-1 bg-gray-100 rounded-lg p-1">
  {views.map(view => (
    <Link
      key={view.key}
      href={view.href}
      className={`px-3 py-2 rounded-md text-sm font-medium ${
        activeView === view.key 
          ? 'bg-white text-gray-900 shadow-sm' 
          : 'text-gray-600 hover:text-gray-900'
      }`}
    >
      {view.label}
    </Link>
  ))}
</div>
```

## Implementation Steps

### Phase 1: Core Components (Week 1)
1. Create base `HierarchicalView` component
2. Build mini profile components (HTA, Course, Semester, Professor)
3. Create subitem components with clickable navigation
4. Design and implement view toggle navigation

### Phase 2: Data Integration (Week 1-2)
1. Create data transformation utilities for each view
2. Implement API routes for hierarchical data
3. Add loading states and error handling
4. Optimize queries for performance

### Phase 3: Page Implementation (Week 2)
1. Build 4 hierarchical view pages
2. Create shared layout with view switcher
3. Enhance existing individual pages for "full details"
4. Add breadcrumb navigation between mini and full views

### Phase 4: Polish & Testing (Week 2-3)
1. Add search/filter capabilities to hierarchical views
2. Implement keyboard navigation
3. Add animations and micro-interactions
4. Comprehensive testing of all navigation flows

## Technical Considerations

### Performance
- Implement virtual scrolling for large datasets
- Use React.memo for mini profile components
- Consider server-side rendering for better SEO
- Add pagination for very large hierarchical lists

### Accessibility
- Proper ARIA labels for hierarchical structure
- Keyboard navigation support
- Screen reader friendly navigation
- Focus management between views

### Responsive Design
- Mobile-friendly hierarchical layouts
- Collapsible sections on smaller screens
- Touch-friendly navigation elements
- Adaptive mini profile layouts

### State Management
- URL-based view state (search params)
- Preserve scroll position when navigating
- Cache hierarchical data to avoid re-fetching
- Optimistic updates for interactive elements

## Success Metrics
- All 4 hierarchical views functional with correct data
- Smooth navigation between mini and full views
- Fast loading times (<500ms for hierarchical data)
- Intuitive user experience with clear navigation paths
- Full test coverage for all components and navigation flows