// Testing this buildQuery function
const buildQuery = (params: Record<string, unknown>): string => {
  const query = Object.entries(params)
    .filter(([, value]) => {
      if (Array.isArray(value)) {
        return value.length > 0
      }
      return value !== undefined && value !== null && value !== ''
    })
    .map(([key, value]) => {
      if (Array.isArray(value)) {
        return value.map((v) => `${key}=${encodeURIComponent(v)}`).join('&')
      }
      return `${key}=${encodeURIComponent(String(value))}`
    })
    .join('&')
  return query ? `?${query}` : ''
}

export const health = () => '/health/'
export const user = () => '/api/auth/user/'

export const balance = () => '/api/balance/'

export const userPlugins = () => '/api/user/plugins/'

export const deleteUser = () => '/api/user/delete/'
// export const userCredits = () => '/api/credits/';

// export const messages = (params: q.MessagesListParams) => {
//     const { conversationId, messageId, ...rest } = params;

//     if (conversationId && messageId) {
//         return `/api/messages/${conversationId}/${messageId}`;
//     }

//     if (conversationId) {
//         return `/api/messages/${conversationId}`;
//     }

//     return `/api/messages${buildQuery(rest)}`;
// };

const shareRoot = '/api/share/'
export const shareMessages = (shareId: string) => `${shareRoot}/${shareId}`
export const getSharedLink = (conversationId: string) =>
  `${shareRoot}/link/${conversationId}`
export const getSharedLinks = (
  pageSize: number,
  isPublic: boolean,
  sortBy: 'title' | 'createdAt',
  sortDirection: 'asc' | 'desc',
  search?: string,
  cursor?: string,
) =>
  `${shareRoot}?pageSize=${pageSize}&isPublic=${isPublic}&sortBy=${sortBy}&sortDirection=${sortDirection}${
    search ? `&search=${search}` : ''
  }${cursor ? `&cursor=${cursor}` : ''}`
export const createSharedLink = (conversationId: string) =>
  `${shareRoot}/${conversationId}`
export const updateSharedLink = (shareId: string) => `${shareRoot}/${shareId}`

const keysEndpoint = '/api/keys/'

export const keys = () => keysEndpoint

export const userKeyQuery = (name: string) => `${keysEndpoint}?name=${name}`

export const revokeUserKey = (name: string) => `${keysEndpoint}/${name}`

export const revokeAllUserKeys = () => `${keysEndpoint}?all=true`

export const abortRequest = (endpoint: string) => `/api/ask/${endpoint}/abort`

export const conversationsRoot = '/api/chat/conversations'

// export const conversations = (params: q.ConversationListParams) => {
//   return `${conversationsRoot}${buildQuery(params)}`;
// };

export const sendAiMessage = () => `${conversationsRoot}/message/`

export const getAllConversations = () => `${conversationsRoot}/`
export const conversationById = (id: string) =>
  `${conversationsRoot}/${id}/messages/`
export const createConversation = () => `${conversationsRoot}/`
export const createConversationWithMessage = () =>
  `${conversationsRoot}/new_with_message/`
export const updateConversation = () => `${conversationsRoot}/update/`
export const deleteConversation = () => `${conversationsRoot}/`
export const deleteAllConversation = () => `${conversationsRoot}/all/`
export const importConversation = () => `${conversationsRoot}/import`

export const favoritePropertyRoot = '/api/favorites'
export const getFavoriteProperties = () => `${favoritePropertyRoot}/`
export const getFavoritePropertiesByUrl = (url: string) =>
  `${favoritePropertyRoot}/by-url/${buildQuery({ details_url: url })}`
export const deleteFavoritePropertiesByUrl = (url: string) =>
  `${favoritePropertyRoot}/by-url/${buildQuery({ details_url: url })}`
export const getFavoriteProperty = (id: string) =>
  `${favoritePropertyRoot}/${id}/`
export const createFavoritePropertyByURL = (url: string) =>
  `${favoritePropertyRoot}/add/${buildQuery({ details_url: url })}`
export const deleteFavoriteProperty = (id: string) =>
  `${favoritePropertyRoot}/${id}/`

export const genTitle = (converstionId: string) =>
  `${conversationsRoot}/gen_title/?conversationId=${converstionId}`

export const forkConversation = () => `${conversationsRoot}/fork`

export const duplicateConversation = () => `${conversationsRoot}/duplicate`

export const search = (q: string, cursor?: string | null) =>
  `/api/search?q=${q}${cursor ? `&cursor=${cursor}` : ''}`

export const searchEnabled = () => '/api/search/enable/'

export const presets = () => '/api/presets/'

export const deletePreset = () => '/api/presets/delete/'

export const aiEndpoints = () => '/api/endpoints/'

export const endpointsConfigOverride = () => '/api/endpoints/config/override/'

export const models = () => '/api/models/'

export const tokenizer = () => '/api/tokenizer/'

export const login = () => '/api/auth/login/'

export const logout = () => '/api/auth/logout/'

export const register = () => '/api/auth/signup/'

export const loginFacebook = () => '/api/auth/facebook/'

export const loginGoogle = () => '/api/auth/google/'

export const refreshToken = (retry?: boolean) => `/api/auth/token/refresh/`

export const resetPassword = (uid: string, token: string) =>
  `/api/auth/password-reset-confirm/${uid}/${token}/`

export const requestPasswordReset = () => '/api/auth/password-reset/'

export const verifyEmail = () => '/api/auth/verify-email/'

export const resendVerifyEmail = () => '/api/auth/resend-verify-email/'

// export const resendVerificationEmail = () => '/api/user/verify/resend/';

export const plugins = () => '/api/plugins/'

export const config = () => '/api/config/'

export const prompts = () => '/api/prompts/'

export const files = () => '/api/files/'

export const images = () => `${files()}/images`

export const avatar = () => `${images()}/avatar`

export const speech = () => `${files()}/speech`

export const speechToText = () => `${speech()}/stt`

export const textToSpeech = () => `${speech()}/tts`

export const textToSpeechManual = () => `${textToSpeech()}/manual`

export const textToSpeechVoices = () => `${textToSpeech()}/voices`

export const getCustomConfigSpeech = () => `${speech()}/config/get`

export const getPromptGroup = (_id: string) => `${prompts()}/groups/${_id}`

export const getPromptGroupsWithFilters = (filter: object) => {
  let url = `${prompts()}/groups`
  if (Object.keys(filter).length > 0) {
    const queryParams = new URLSearchParams(
      filter as Record<string, string>,
    ).toString()
    url += `?${queryParams}`
  }
  return url
}

export const getPromptsWithFilters = (filter: object) => {
  let url = prompts()
  if (Object.keys(filter).length > 0) {
    const queryParams = new URLSearchParams(
      filter as Record<string, string>,
    ).toString()
    url += `?${queryParams}`
  }
  return url
}

export const getPrompt = (_id: string) => `${prompts()}/${_id}`

export const getRandomPrompts = (limit: number, skip: number) =>
  `${prompts()}/random?limit=${limit}&skip=${skip}`

export const postPrompt = prompts

export const updatePromptGroup = getPromptGroup

export const updatePromptLabels = (_id: string) => `${getPrompt(_id)}/labels`

export const updatePromptTag = (_id: string) =>
  `${getPrompt(_id)}/tags/production`

export const deletePromptGroup = getPromptGroup

export const deletePrompt = ({
  _id,
  groupId,
}: {
  _id: string
  groupId: string
}) => {
  return `${prompts()}/${_id}?groupId=${groupId}`
}

export const getCategories = () => '/api/categories/'

export const getAllPromptGroups = () => `${prompts()}/all/`

/* Roles */
export const roles = () => '/api/roles/'
export const getRole = (roleName: string) =>
  `${roles()}/${roleName.toLowerCase()}`
export const updatePromptPermissions = (roleName: string) =>
  `${getRole(roleName)}/prompts`
export const updateAgentPermissions = (roleName: string) =>
  `${getRole(roleName)}/agents`

/* Conversation Tags */
export const conversationTags = (tag?: string) =>
  `/api/tags${tag != null && tag ? `/${encodeURIComponent(tag)}` : ''}`

export const conversationTagsList = (
  pageNumber: string,
  sort?: string,
  order?: string,
) =>
  `${conversationTags()}/list?pageNumber=${pageNumber}${sort ? `&sort=${sort}` : ''}${
    order ? `&order=${order}` : ''
  }`

export const addTagToConversation = (conversationId: string) =>
  `${conversationTags()}/convo/${conversationId}`

export const userTerms = () => '/api/user/terms/'
export const acceptUserTerms = () => '/api/user/terms/accept/'
export const banner = () => '/api/banner/'

// Two-Factor Endpoints
export const enableTwoFactor = () => '/api/auth/2fa/enable/'
export const verifyTwoFactor = () => '/api/auth/2fa/verify/'
export const confirmTwoFactor = () => '/api/auth/2fa/confirm/'
export const disableTwoFactor = () => '/api/auth/2fa/disable/'
export const regenerateBackupCodes = () => '/api/auth/2fa/backup/regenerate/'
export const verifyTwoFactorTemp = () => '/api/auth/2fa/verify-temp/'
