import { contextBridge, ipcRenderer } from 'electron'

const api = {
  // Auth
  auth: {
    restoreSession: () => ipcRenderer.invoke('auth:restoreSession'),
    signIn: (email: string, password: string) => ipcRenderer.invoke('auth:signIn', email, password),
    signUp: (email: string, password: string, fullName: string) =>
      ipcRenderer.invoke('auth:signUp', email, password, fullName),
    signOut: () => ipcRenderer.invoke('auth:signOut'),
    getUser: () => ipcRenderer.invoke('auth:getUser'),
    checkLicense: (email: string) => ipcRenderer.invoke('auth:checkLicense', email),
    signInWithProvider: (provider: 'google' | 'github') =>
      ipcRenderer.invoke('auth:signInWithProvider', provider),
    onOAuthResult: (callback: (data: unknown) => void) => {
      ipcRenderer.on('auth:oauthResult', (_e, data) => callback(data))
      return () => { ipcRenderer.removeAllListeners('auth:oauthResult') }
    }
  },

  // Leads
  leads: {
    getAll: () => ipcRenderer.invoke('leads:getAll'),
    getByStatus: (status: string) => ipcRenderer.invoke('leads:getByStatus', status),
    getById: (id: string) => ipcRenderer.invoke('leads:getById', id),
    existsByPlaceId: (placeId: string) => ipcRenderer.invoke('leads:existsByPlaceId', placeId),
    create: (lead: unknown) => ipcRenderer.invoke('leads:create', lead),
    update: (id: string, fields: unknown) => ipcRenderer.invoke('leads:update', id, fields),
    delete: (id: string) => ipcRenderer.invoke('leads:delete', id),
    getCount: () => ipcRenderer.invoke('leads:getCount'),
    getCountByStatus: () => ipcRenderer.invoke('leads:getCountByStatus')
  },

  // Activities
  activities: {
    getByLeadId: (leadId: string) => ipcRenderer.invoke('activities:getByLeadId', leadId),
    getRecent: (limit?: number) => ipcRenderer.invoke('activities:getRecent', limit),
    create: (activity: unknown) => ipcRenderer.invoke('activities:create', activity),
    getTodayCounts: () => ipcRenderer.invoke('activities:getTodayCounts')
  },

  // Gamification
  gamification: {
    getProfile: () => ipcRenderer.invoke('gamification:getProfile'),
    updateProfile: (fields: unknown) => ipcRenderer.invoke('gamification:updateProfile', fields),
    addXP: (amount: number) => ipcRenderer.invoke('gamification:addXP', amount),
    incrementStat: (field: string) => ipcRenderer.invoke('gamification:incrementStat', field),
    getAchievements: () => ipcRenderer.invoke('gamification:getAchievements'),
    upsertAchievement: (a: unknown) => ipcRenderer.invoke('gamification:upsertAchievement', a),
    getDailyStats: (date: string) => ipcRenderer.invoke('gamification:getDailyStats', date),
    upsertDailyStats: (date: string, field: string, amount: number) =>
      ipcRenderer.invoke('gamification:upsertDailyStats', date, field, amount),
    getRecentDailyStats: (days?: number) =>
      ipcRenderer.invoke('gamification:getRecentDailyStats', days),
    updateStreak: () => ipcRenderer.invoke('gamification:updateStreak')
  },

  // Settings
  settings: {
    get: (key: string) => ipcRenderer.invoke('settings:get', key),
    set: (key: string, value: string) => ipcRenderer.invoke('settings:set', key, value),
    getAll: () => ipcRenderer.invoke('settings:getAll'),
    delete: (key: string) => ipcRenderer.invoke('settings:delete', key)
  },

  // Search
  search: {
    places: (query: string, apiKey: string, pageToken?: string) =>
      ipcRenderer.invoke('search:places', query, apiKey, pageToken),
    testApiKey: (apiKey: string) => ipcRenderer.invoke('search:testApiKey', apiKey)
  },

  // AI Agents
  agents: {
    linkedinLogin: () => ipcRenderer.invoke('agents:linkedinLogin'),
    linkedinStatus: () => ipcRenderer.invoke('agents:linkedinStatus'),
    startSession: (targetUrl: string) => ipcRenderer.invoke('agents:startSession', targetUrl),
    startAgent: (agentId: string, targetUrl: string, sessionId: string) =>
      ipcRenderer.invoke('agents:startAgent', agentId, targetUrl, sessionId),
    startAll: (targetUrl: string, sessionId: string) =>
      ipcRenderer.invoke('agents:startAll', targetUrl, sessionId),
    approve: (agentId: string, runId: string) => ipcRenderer.invoke('agents:approve', agentId, runId),
    reject: (agentId: string, runId: string) => ipcRenderer.invoke('agents:reject', agentId, runId),
    stopAgent: (agentId: string) => ipcRenderer.invoke('agents:stopAgent', agentId),
    stopAll: () => ipcRenderer.invoke('agents:stopAll'),
    restartAgent: (agentId: string) => ipcRenderer.invoke('agents:restartAgent', agentId),
    showMessage: (data: { agentName: string; agentAvatar: string; prospectName: string; prospectTitle: string; prospectCompany: string; message: string; runId: string }) =>
      ipcRenderer.invoke('agents:showMessage', data) as Promise<{ saved: boolean; message?: string }>,
    getSessionRuns: (sessionId: string) => ipcRenderer.invoke('agents:getSessionRuns', sessionId),
    onStatus: (callback: (data: unknown) => void) => {
      ipcRenderer.on('agents:status', (_e, data) => callback(data))
      return () => { ipcRenderer.removeAllListeners('agents:status') }
    },
    onReview: (callback: (data: unknown) => void) => {
      ipcRenderer.on('agents:review', (_e, data) => callback(data))
      return () => { ipcRenderer.removeAllListeners('agents:review') }
    },
    onBrandAnalysis: (callback: (data: unknown) => void) => {
      ipcRenderer.on('agents:brandAnalysis', (_e, data) => callback(data))
      return () => { ipcRenderer.removeAllListeners('agents:brandAnalysis') }
    },
    onSent: (callback: (data: unknown) => void) => {
      ipcRenderer.on('agents:sent', (_e, data) => callback(data))
      return () => { ipcRenderer.removeAllListeners('agents:sent') }
    }
  },

  // Response Monitor
  monitor: {
    start: (intervalMinutes?: number) => ipcRenderer.invoke('monitor:start', intervalMinutes),
    stop: () => ipcRenderer.invoke('monitor:stop'),
    status: () => ipcRenderer.invoke('monitor:status'),
    checkNow: () => ipcRenderer.invoke('monitor:checkNow'),
    onResponse: (callback: (data: unknown) => void) => {
      ipcRenderer.on('monitor:response', (_e, data) => callback(data))
      return () => { ipcRenderer.removeAllListeners('monitor:response') }
    }
  },

  // Outreach Tracking
  outreach: {
    getAll: () => ipcRenderer.invoke('outreach:getAll'),
    getPending: () => ipcRenderer.invoke('outreach:getPending'),
    getResponses: () => ipcRenderer.invoke('outreach:getResponses'),
    getUnread: () => ipcRenderer.invoke('outreach:getUnread'),
    markRead: (id: string) => ipcRenderer.invoke('outreach:markRead', id),
    markAllRead: () => ipcRenderer.invoke('outreach:markAllRead'),
    getStats: () => ipcRenderer.invoke('outreach:getStats')
  },

  // Lead Intelligence
  intel: {
    generate: (leadId: string, lead: unknown) => ipcRenderer.invoke('intel:generate', leadId, lead),
    get: (leadId: string) => ipcRenderer.invoke('intel:get', leadId),
    clear: (leadId: string) => ipcRenderer.invoke('intel:clear', leadId)
  },

  // Owner Discovery
  owner: {
    discover: (leadId: string, lead: unknown) => ipcRenderer.invoke('owner:discover', leadId, lead),
    get: (leadId: string) => ipcRenderer.invoke('owner:get', leadId),
    clear: (leadId: string) => ipcRenderer.invoke('owner:clear', leadId)
  },

  // Campaign Analytics
  campaign: {
    stats: () => ipcRenderer.invoke('campaign:stats')
  },

  // My Product
  product: {
    get: () => ipcRenderer.invoke('product:get'),
    update: (data: unknown) => ipcRenderer.invoke('product:update', data),
    isConfigured: () => ipcRenderer.invoke('product:isConfigured')
  },

  // Call Mode
  callmode: {
    getQueue: (limit?: number) => ipcRenderer.invoke('callmode:getQueue', limit),
    getPrep: (leadId: string) => ipcRenderer.invoke('callmode:getPrep', leadId),
    logOutcome: (data: unknown) => ipcRenderer.invoke('callmode:logOutcome', data),
    startSession: (mode?: string) => ipcRenderer.invoke('callmode:startSession', mode),
    endSession: (sessionId: string) => ipcRenderer.invoke('callmode:endSession', sessionId),
    getSession: (sessionId: string) => ipcRenderer.invoke('callmode:getSession', sessionId)
  },

  // Follow-ups
  followups: {
    getDueToday: () => ipcRenderer.invoke('followups:getDueToday'),
    getOverdue: () => ipcRenderer.invoke('followups:getOverdue'),
    getByLead: (leadId: string) => ipcRenderer.invoke('followups:getByLead', leadId),
    schedule: (data: unknown) => ipcRenderer.invoke('followups:schedule', data),
    scheduleFromCadence: (leadId: string, cadenceId: string) => ipcRenderer.invoke('followups:scheduleFromCadence', leadId, cadenceId),
    complete: (id: string) => ipcRenderer.invoke('followups:complete', id),
    skip: (id: string) => ipcRenderer.invoke('followups:skip', id),
    getCadences: () => ipcRenderer.invoke('followups:getCadences'),
    saveCadence: (cadence: unknown) => ipcRenderer.invoke('followups:saveCadence', cadence),
    deleteCadence: (id: string) => ipcRenderer.invoke('followups:deleteCadence', id)
  },

  // Scripts + Objection Playbook
  scripts: {
    getAll: () => ipcRenderer.invoke('scripts:getAll'),
    save: (script: unknown) => ipcRenderer.invoke('scripts:save', script),
    delete: (id: string) => ipcRenderer.invoke('scripts:delete', id),
    generate: (context: unknown) => ipcRenderer.invoke('scripts:generate', context),
    trackUsage: (id: string, success: boolean) => ipcRenderer.invoke('scripts:trackUsage', id, success),
    getObjections: () => ipcRenderer.invoke('scripts:getObjections'),
    saveObjection: (obj: unknown) => ipcRenderer.invoke('scripts:saveObjection', obj),
    deleteObjection: (id: string) => ipcRenderer.invoke('scripts:deleteObjection', id),
    generateObjections: (context: unknown) => ipcRenderer.invoke('scripts:generateObjections', context)
  },

  // Analytics
  analytics: {
    getVolumeTrends: (days?: number) => ipcRenderer.invoke('analytics:getVolumeTrends', days),
    getConversionFunnel: () => ipcRenderer.invoke('analytics:getConversionFunnel'),
    getCallHeatmap: () => ipcRenderer.invoke('analytics:getCallHeatmap'),
    getIndustryStats: () => ipcRenderer.invoke('analytics:getIndustryStats'),
    getWeeklyInsights: () => ipcRenderer.invoke('analytics:getWeeklyInsights')
  },

  // Email
  email: {
    generate: (context: unknown) => ipcRenderer.invoke('email:generate', context),
    getTemplates: () => ipcRenderer.invoke('email:getTemplates'),
    saveTemplate: (template: unknown) => ipcRenderer.invoke('email:saveTemplate', template),
    deleteTemplate: (id: string) => ipcRenderer.invoke('email:deleteTemplate', id),
    logSent: (data: unknown) => ipcRenderer.invoke('email:logSent', data)
  },

  // App info
  getVersion: () => ipcRenderer.invoke('app:getVersion')
}

export type ElectronAPI = typeof api

contextBridge.exposeInMainWorld('api', api)
