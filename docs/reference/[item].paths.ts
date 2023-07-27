import { useApiDocumentation } from '../.vitepress/api'

const apiDocs = useApiDocumentation()

const resolver = {
  paths: async () => {
    await apiDocs.add()

    return apiDocs.getPageData()
  }
}

export default resolver
