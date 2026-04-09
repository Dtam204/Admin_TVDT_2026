/**
 * Admin API Endpoints
 * Centralized endpoint definitions for admin section
 */

export const AdminEndpoints = {
  // Auth
  auth: {
    login: "/api/auth/login",
    logout: "/api/auth/logout",
  },
  
  // Menus
  menus: {
    list: "/api/admin/menu",
    detail: (id: number) => `/api/admin/menu/${id}`,
  },
  
  // Users
  users: {
    list: "/api/admin/users",
    detail: (id: number) => `/api/admin/users/${id}`,
  },
  
  // Roles
  roles: {
    list: "/api/admin/roles",
    detail: (id: number) => `/api/admin/roles/${id}`,
    permissions: (id: number) => `/api/admin/roles/${id}/permissions`,
  },
  
  // Permissions
  permissions: {
    list: "/api/admin/permissions",
    detail: (id: number) => `/api/admin/permissions/${id}`,
  },
  
  // News
  news: {
    list: "/api/admin/news",
    detail: (id: number) => `/api/admin/news/${id}`,
    create: "/api/admin/news",
    update: (id: number) => `/api/admin/news/${id}`,
    status: (id: number) => `/api/admin/news/${id}/status`,
    featured: (id: number) => `/api/admin/news/${id}/featured`,
    delete: (id: number) => `/api/admin/news/${id}`,
  },
  
  // Comments
  comments: {
    admin: {
      list: "/api/admin/comments",
      status: (id: number) => `/api/admin/comments/${id}/status`,
      reports: "/api/admin/comments/reports",
      delete: (id: number) => `/api/admin/comments/${id}`,
      reply: (id: number) => `/api/admin/comments/${id}/reply`,
    },
    public: {
      list: (objectType: string, objectId: number) => `/api/public/comments/${objectType}/${objectId}`,
      create: "/api/public/comments",
      update: (id: number) => `/api/public/comments/${id}`,
      delete: (id: number) => `/api/public/comments/${id}`,
      report: (id: number) => `/api/public/comments/${id}/report`,
    }
  },
  
  // Categories
  categories: {
    list: "/api/admin/news-categories",
    detail: (code: string) => `/api/admin/news-categories/${code}`,
  },
  
  // Upload
  upload: {
    image: "/api/admin/upload/image",
    file: "/api/admin/upload/file",
    files: "/api/admin/upload/files",
    deleteImage: (filename: string) => `/api/admin/upload/image/${filename}`,
  },
  
  // Media
  media: {
    folders: {
      list: "/api/admin/media-folders",
      tree: "/api/admin/media-folders/tree",
      detail: (id: number) => `/api/admin/media-folders/${id}`,
    },
    files: {
      list: "/api/admin/media-files",
      detail: (id: number) => `/api/admin/media-files/${id}`,
    },
  },

  // Testimonials
  testimonials: {
    list: "/api/admin/testimonials",
    detail: (id: number) => `/api/admin/testimonials/${id}`,
  },

  // Homepage
  homepage: {
    list: "/api/admin/homepage",
    block: (sectionType: string) => `/api/admin/homepage/${sectionType}`,
  },

  // Contact
  contact: {
    hero: {
      get: "/api/admin/contact/hero",
      update: "/api/admin/contact/hero",
    },
    infoCards: {
      get: "/api/admin/contact/info-cards",
      update: "/api/admin/contact/info-cards",
    },
    form: {
      get: "/api/admin/contact/form",
      update: "/api/admin/contact/form",
    },
    sidebar: {
      get: "/api/admin/contact/sidebar",
      update: "/api/admin/contact/sidebar",
    },
    map: {
      get: "/api/admin/contact/map",
      update: "/api/admin/contact/map",
    },
    requests: {
      list: "/api/admin/contact/requests",
      detail: (id: number) => `/api/admin/contact/requests/${id}`,
      update: (id: number) => `/api/admin/contact/requests/${id}`,
      delete: (id: number) => `/api/admin/contact/requests/${id}`,
    },
  },
  
  // Translation
  translate: "/api/admin/translate",
  translateField: "/api/admin/translate/field",

  // ============================================================================
  // Phase 1 MVP - Library & Courses System
  // ============================================================================
  
  // Books Module
  books: {
    list: "/api/admin/books",
    detail: (id: number) => `/api/admin/books/${id}`,
    create: "/api/admin/books",
    update: (id: number) => `/api/admin/books/${id}`,
    delete: (id: number) => `/api/admin/books/${id}`,
  },
  
  authors: {
    list: "/api/admin/authors",
    detail: (id: number) => `/api/admin/authors/${id}`,
    create: "/api/admin/authors",
    update: (id: number) => `/api/admin/authors/${id}`,
    delete: (id: number) => `/api/admin/authors/${id}`,
  },
  
  bookCategories: {
    list: "/api/admin/book-categories",
    detail: (id: number) => `/api/admin/book-categories/${id}`,
    create: "/api/admin/book-categories",
    update: (id: number) => `/api/admin/book-categories/${id}`,
    delete: (id: number) => `/api/admin/book-categories/${id}`,
  },
  
  publishers: {
    list: "/api/admin/publishers",
    detail: (id: number) => `/api/admin/publishers/${id}`,
    create: "/api/admin/publishers",
    update: (id: number) => `/api/admin/publishers/${id}`,
    delete: (id: number) => `/api/admin/publishers/${id}`,
  },
  
  bookLoans: {
    list: "/api/admin/book-loans",
    detail: (id: number) => `/api/admin/book-loans/${id}`,
    create: "/api/admin/book-loans",
    update: (id: number) => `/api/admin/book-loans/${id}`,
    delete: (id: number) => `/api/admin/book-loans/${id}`,
  },
  
  // Courses Module
  courses: {
    list: "/api/admin/courses",
    detail: (id: number) => `/api/admin/courses/${id}`,
    create: "/api/admin/courses",
    update: (id: number) => `/api/admin/courses/${id}`,
    delete: (id: number) => `/api/admin/courses/${id}`,
  },
  
  courseCategories: {
    list: "/api/admin/course-categories",
    detail: (id: number) => `/api/admin/course-categories/${id}`,
    create: "/api/admin/course-categories",
    update: (id: number) => `/api/admin/course-categories/${id}`,
    delete: (id: number) => `/api/admin/course-categories/${id}`,
  },
  
  instructors: {
    list: "/api/admin/instructors",
    detail: (id: number) => `/api/admin/instructors/${id}`,
    create: "/api/admin/instructors",
    update: (id: number) => `/api/admin/instructors/${id}`,
    delete: (id: number) => `/api/admin/instructors/${id}`,
  },
  
  // Members Module
  members: {
    list: "/api/admin/members",
    detail: (id: number) => `/api/admin/members/${id}`,
    create: "/api/admin/members",
    update: (id: number) => `/api/admin/members/${id}`,
    delete: (id: number) => `/api/admin/members/${id}`,
  },
  
  membershipPlans: {
    list: "/api/admin/membership-plans",
    detail: (id: number) => `/api/admin/membership-plans/${id}`,
    create: "/api/admin/membership-plans",
    update: (id: number) => `/api/admin/membership-plans/${id}`,
    delete: (id: number) => `/api/admin/membership-plans/${id}`,
  },
  
  // Payments Module
  paymentsPhase1: {
    list: "/api/admin/payments",
    detail: (id: number) => `/api/admin/payments/${id}`,
    create: "/api/admin/payments",
    update: (id: number) => `/api/admin/payments/${id}`,
    delete: (id: number) => `/api/admin/payments/${id}`,
  },
} as const;

