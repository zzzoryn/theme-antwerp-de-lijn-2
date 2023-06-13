interface category {
  created_at: string
  description: string
  html_url: string
  id: number
  locale: string
  name: string
  outdated: false
  position: number
  source_locale: string
  updated_at: string
  url: string
  draft: boolean
}

interface section {
  category_id: number
  created_at: string
  description: string
  html_url: string
  id: number
  locale: string
  name: string
  outdated: boolean
  parent_section_id: number | null
  position: number
  sorting: string
  source_locale: string
  theme_template: string
  updated_at: string
  url: string
  draft: boolean
}

interface article {
  author_id: number
  body: string
  comments_disabled: boolean
  created_at: string
  draft: boolean
  edited_at: string
  html_url: string
  id: number
  label_names: string[]
  locale: string
  name: string
  outdated: boolean
  outdated_locales: any[]
  permission_group_id: number
  position: number
  promoted: boolean
  section_id: number
  source_locale: string
  title: string
  updated_at: string
  url: string
  user_segment_id: number | null
  vote_count: number
  vote_sum: number
}

interface data {
  categories: category[]
  sections: section[]
  articles: article[]
  [name: string]: any
}

interface jqueryPluginMethods {
  init(uid: string, options: any, $container: any): void
  [name: string]: any
}

interface jqueryPluginOptions {
  api?: string[],
  defaultOptions?: any,
  methods: jqueryPluginMethods
}

declare namespace $$ {
  const jqueryPlugin: (name: string, options: jqueryPluginOptions) => void;
  const initPlugins: ($container?: any) => void;
  const Request: (options?: any) => {
    fetch(url: string, data?: any): Promise<data | any>
  };
  const getDuration: ($element: any) => number;
}
