# MyCrewManager - Project Management Platform

A comprehensive project management platform built with React, TypeScript, and Vite. MyCrewManager provides AI-powered project analysis, team collaboration tools, and streamlined project creation workflows.

## Recent Updates - Project Generation Flow Enhancement

### 🚀 New Features & Improvements

**Enhanced Project Creation Workflow:**
- **7-Step Project Generation Process**: Implemented a comprehensive multi-step workflow for project creation
- **AI-Powered Analysis**: Integrated AI analysis for proposal processing and backlog generation
- **Smart Flow Management**: Added intelligent step skipping when proposals are not uploaded
- **Confirmation Modals**: Added non-cancelable confirmation dialogs for AI operations
- **Responsive Design**: Implemented fully responsive layout with adaptive step indicators

**UI/UX Improvements:**
- **Custom Scrollbar Styling**: Added theme-aware custom scrollbars for better visual consistency
- **Dark Mode Support**: Enhanced dark mode compatibility across all components
- **Navigation Enhancement**: Added "Back to Projects" button with proper positioning
- **Container Optimization**: Improved responsive container sizing and layout structure
- **Step Indicator**: Created adaptive step progress indicators for desktop, tablet, and mobile views

**Technical Enhancements:**
- **Authentication Integration**: Improved token handling and API authentication
- **Error Handling**: Enhanced error management and user feedback systems
- **State Management**: Optimized component state management for complex workflows
- **Performance**: Improved rendering performance with better component structure

### 🔧 Technical Details

**Project Generation Steps:**
1. Create Project → 2. Upload Proposal → 3. AI Analysis → 4. Review & Edit → 5. Generate Backlog → 6. Review Backlog → 7. Invite Team

**Key Components Updated:**
- `generateProject.tsx`: Complete workflow restructuring
- `LoadingSpinner.tsx`: Modal implementation with dark mode support
- `index.css`: Custom scrollbar styling
- Responsive design system implementation

---

## Development Setup

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default tseslint.config([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      ...tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      ...tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      ...tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default tseslint.config([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```
