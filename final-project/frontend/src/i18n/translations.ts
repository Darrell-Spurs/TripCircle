export type Language = 'zh-TW' | 'en'

export interface Translations {
  // Common
  common: {
    loading: string
    error: string
    success: string
    cancel: string
    save: string
    delete: string
    edit: string
    view: string
    create: string
    update: string
    confirm: string
    back: string
    next: string
    submit: string
    search: string
    filter: string
    close: string
    createSuccess: string
  }

  // Navigation
  nav: {
    dashboard: string
    explore: string
    analytics: string
    login: string
    signUp: string
    logout: string
    guestMode: string
    myTrips: string
  }

  // Landing Page
  landing: {
    title: string
    subtitle: string
    goToDashboard: string
    login: string
    signUp: string
    continueWithoutLogin: string
  }

  // Auth
  auth: {
    signIn: string
    signInTo: string
    createAccount: string
    email: string
    password: string
    name: string
    emailAddress: string
    signInButton: string
    signingIn: string
    signUpButton: string
    creatingAccount: string
    orContinueWith: string
    google: string
    dontHaveAccount: string
    alreadyHaveAccount: string
    loginFailed: string
    registrationFailed: string
  }

  // Dashboard
  dashboard: {
    myTrips: string
    newTrip: string
    createTrip: string
    noTrips: string
    noTripsDesc: string
    status: string
    role: string
    browsingAsGuest: string
    browsingAsGuestDesc: string
    loginToSave: string
    welcomeGuest: string
    welcomeGuestDesc: string
    toCreateTrips: string
    youCanExplore: string
    explorePlaces: string
    viewAnalytics: string
  }

  // Trip
  trip: {
    title: string
    description: string
    startDate: string
    endDate: string
    coverImage: string
    coverImageUrl: string
    status: string
    createTrip: string
    editTrip: string
    editDetails: string
    deleteTrip: string
    deleteConfirm: string
    tripDetails: string
    activities: string
    members: string
    share: string
    invite: string
    owner: string
    editor: string
    viewer: string
    planning: string
    upcoming: string
    ongoing: string
    active: string
    completed: string
    cancelled: string
    listView: string
    calendarView: string
    dates: string
    yourRole: string
    saving: string
    saveChanges: string
    publishToFeed: string
    publishDescription: string
    published: string
    draft: string
    tripStory: string
    tripStoryPlaceholder: string
    clickToAddStory: string
    allowImports: string
    allowImportsDescription: string
    unpublish: string
    unpublishing: string
    unpublishConfirm: string
    viewInFeed: string
    publish: string
    publishing: string
    describePlaceholder: string
  }

  // Activity
  activity: {
    addActivity: string
    editActivity: string
    deleteActivity: string
    title: string
    titleRequired: string
    notes: string
    location: string
    locationName: string
    address: string
    startTime: string
    endTime: string
    date: string
    selectDate: string
    addToTrip: string
    add: string
    selectTrip: string
    chooseTrip: string
    noActivitiesForDay: string
    more: string
    addVisitingTime: string
    noAssignedTime: string
    storyForFeed: string
    storyPlaceholder: string
    storyDescription: string
    quickNotesPlaceholder: string
  }

  // Explore
  explore: {
    title: string
    searchKeyword: string
    searchPlaceholder: string
    location: string
    locationPlaceholder: string
    results: string
    map: string
    noPlacesFound: string
    searching: string
    loginToAdd: string
    googleMapsNotConfigured: string
  }

  // Admin
  admin: {
    analytics: string
    authenticationRequired: string
    authRequiredDesc: string
    goBack: string
    totalUsers: string
    totalTrips: string
    tripsOverTime: string
    dailyActiveUsers: string
    exploreUsage: string
    shareLinkStats: string
    total: string
    active: string
    mostActiveTrips: string
    eventTypeBreakdown: string
  }

  // Share
  share: {
    shareTrip: string
    createShareLink: string
    shareLink: string
    permission: string
    viewOnly: string
    canEdit: string
    expiresAt: string
    never: string
    copyLink: string
    linkCopied: string
    sharedTripReadOnly: string
    importToMyTrips: string
    importing: string
    pleaseLoginToImport: string
    tripImportedSuccess: string
    failedToImport: string
    itinerary: string
    noActivitiesPlanned: string
  }

  // Members
  members: {
    members: string
    inviteMember: string
    email: string
    role: string
    selectRole: string
    remove: string
    invite: string
    inviting: string
    failedToInvite: string
    removeConfirm: string
  }

  // Feed
  feed: {
    discoverTrips: string
    exploreDescription: string
    noTripsYet: string
    beFirstToShare: string
    moreActivities: string
    previous: string
    next: string
    page: string
    of: string
    tripNotFound: string
    tripNotFoundDesc: string
    goToHome: string
    backToFeed: string
    viewAndImport: string
    published: string
    activities: string
    noActivitiesInTrip: string
  }
}

export const translations: Record<Language, Translations> = {
  'zh-TW': {
    common: {
      loading: '載入中...',
      error: '錯誤',
      success: '成功',
      cancel: '取消',
      save: '儲存',
      delete: '刪除',
      edit: '編輯',
      view: '查看',
      create: '建立',
      update: '更新',
      confirm: '確認',
      back: '返回',
      next: '下一步',
      submit: '提交',
      search: '搜尋',
      filter: '篩選',
      close: '關閉',
      createSuccess: '建立成功',
    },
    nav: {
      dashboard: '我的旅程',
      explore: '探索',
      analytics: '分析',
      login: '登入',
      signUp: '註冊',
      logout: '登出',
      guestMode: '訪客模式',
      myTrips: '我的旅程',
    },
    landing: {
      title: '🧭 TripCircle',
      subtitle: '與朋友一起規劃旅程',
      goToDashboard: '前往儀表板',
      login: '登入',
      signUp: '註冊',
      continueWithoutLogin: '不登入繼續',
    },
    auth: {
      signIn: '登入',
      signInTo: '登入 TripCircle',
      createAccount: '建立帳號',
      email: '電子郵件',
      password: '密碼',
      name: '姓名',
      emailAddress: '電子郵件地址',
      signInButton: '登入',
      signingIn: '登入中...',
      signUpButton: '註冊',
      creatingAccount: '建立帳號中...',
      orContinueWith: '或使用',
      google: 'Google',
      dontHaveAccount: '還沒有帳號？註冊',
      alreadyHaveAccount: '已有帳號？登入',
      loginFailed: '登入失敗',
      registrationFailed: '註冊失敗',
    },
    dashboard: {
      myTrips: '我的旅程',
      newTrip: '新增旅程',
      createTrip: '建立旅程',
      noTrips: '還沒有旅程。建立您的第一個旅程！',
      noTripsDesc: '還沒有旅程。建立您的第一個旅程！',
      status: '狀態',
      role: '角色',
      browsingAsGuest: '以訪客身份瀏覽 - ',
      browsingAsGuestDesc: '以訪客身份瀏覽 - ',
      loginToSave: '登入以儲存您的旅程',
      welcomeGuest: '歡迎！您正在以訪客身份瀏覽。',
      welcomeGuestDesc: '要建立和儲存旅程，請註冊或登入。',
      toCreateTrips: '要建立和儲存旅程，請註冊或登入。',
      youCanExplore: '您仍然可以探索：',
      explorePlaces: '探索地點',
      viewAnalytics: '查看分析',
    },
    trip: {
      title: '標題',
      description: '描述',
      startDate: '開始日期',
      endDate: '結束日期',
      coverImage: '封面圖片',
      coverImageUrl: '封面圖片網址',
      status: '狀態',
      createTrip: '建立旅程',
      editTrip: '編輯旅程',
      editDetails: '編輯詳情',
      deleteTrip: '刪除旅程',
      deleteConfirm: '您確定要刪除這個旅程嗎？',
      tripDetails: '旅程詳情',
      activities: '活動',
      members: '成員',
      share: '分享',
      invite: '邀請',
      owner: '擁有者',
      editor: '編輯者',
      viewer: '檢視者',
      planning: '規劃中',
      upcoming: '即將開始',
      ongoing: '進行中',
      active: '進行中',
      completed: '已完成',
      cancelled: '已取消',
      listView: '列表檢視',
      calendarView: '月曆檢視',
      dates: '日期',
      yourRole: '您的角色',
      saving: '儲存中...',
      saveChanges: '儲存變更',
      publishToFeed: '發布到動態',
      publishDescription: '與社群分享您的旅程體驗',
      published: '已發布',
      draft: '草稿',
      tripStory: '旅程故事（用於動態）',
      tripStoryPlaceholder: '分享您的旅程體驗、提示和亮點...',
      clickToAddStory: '點擊以新增旅程故事...',
      allowImports: '允許匯入',
      allowImportsDescription: '讓其他人將此旅程匯入作為他們自己旅程的範本',
      unpublish: '取消發布',
      unpublishing: '取消發布中...',
      unpublishConfirm: '您確定要取消發布這個旅程嗎？',
      viewInFeed: '在動態中查看 →',
      publish: '發布',
      publishing: '發布中...',
      describePlaceholder: '描述您的旅程...',
    },
    activity: {
      addActivity: '新增活動',
      editActivity: '編輯活動',
      deleteActivity: '刪除活動',
      title: '標題',
      titleRequired: '標題 *',
      notes: '備註',
      location: '地點',
      locationName: '地點名稱',
      address: '地址',
      startTime: '開始時間',
      endTime: '結束時間',
      date: '日期',
      selectDate: '選擇日期',
      addToTrip: '加入旅程',
      add: '加入',
      selectTrip: '選擇旅程',
      chooseTrip: '選擇一個旅程...',
      noActivitiesForDay: '這一天沒有安排活動',
      more: '更多',
      addVisitingTime: '新增參觀時間',
      noAssignedTime: '未指定時間',
      storyForFeed: '故事（用於動態）',
      storyPlaceholder: '分享您在此地點的體驗，當發布到動態時...',
      storyDescription: '這將在旅程發布時顯示',
      quickNotesPlaceholder: '快速備註...',
    },
    explore: {
      title: '探索地點',
      searchKeyword: '搜尋關鍵字',
      searchPlaceholder: '例如：博物館、餐廳、公園',
      location: '地點（選填）',
      locationPlaceholder: '例如：台北市',
      results: '結果',
      map: '地圖',
      noPlacesFound: '找不到地點。請嘗試其他搜尋。',
      searching: '搜尋中...',
      loginToAdd: '登入以加入旅程',
      googleMapsNotConfigured: '未設定 Google Maps API 金鑰',
    },
    admin: {
      analytics: '管理員分析儀表板',
      authenticationRequired: '需要驗證',
      authRequiredDesc: '管理員分析僅供已驗證的使用者使用。',
      goBack: '返回',
      totalUsers: '總使用者數',
      totalTrips: '總旅程數',
      tripsOverTime: '旅程趨勢',
      dailyActiveUsers: '每日活躍使用者',
      exploreUsage: '探索功能使用次數',
      shareLinkStats: '分享連結統計',
      total: '總數',
      active: '活躍',
      mostActiveTrips: '最活躍的旅程',
      eventTypeBreakdown: '事件類型分析',
    },
    share: {
      shareTrip: '分享旅程',
      createShareLink: '建立分享連結',
      shareLink: '分享連結',
      permission: '權限',
      viewOnly: '僅檢視',
      canEdit: '可編輯',
      expiresAt: '到期時間',
      never: '永不過期',
      copyLink: '複製連結',
      linkCopied: '連結已複製',
      sharedTripReadOnly: '分享的旅程 - 僅供檢視',
      importToMyTrips: '匯入到我的旅程',
      importing: '匯入中...',
      pleaseLoginToImport: '請登入以匯入此旅程',
      tripImportedSuccess: '旅程 "{title}" 匯入成功！',
      failedToImport: '匯入旅程失敗',
      itinerary: '行程',
      noActivitiesPlanned: '尚未安排活動。',
    },
    members: {
      members: '成員',
      inviteMember: '邀請成員',
      email: '電子郵件',
      role: '角色',
      selectRole: '選擇角色',
      remove: '移除',
      invite: '邀請',
      inviting: '邀請中...',
      failedToInvite: '邀請成員失敗',
      removeConfirm: '您確定要移除此成員嗎？',
    },
    feed: {
      discoverTrips: '發現旅程',
      exploreDescription: '探索社群分享的旅行體驗',
      noTripsYet: '還沒有旅程',
      beFirstToShare: '成為第一個分享您的旅行體驗！',
      moreActivities: '更多',
      previous: '上一頁',
      next: '下一頁',
      page: '第',
      of: '頁，共',
      tripNotFound: '找不到旅程',
      tripNotFoundDesc: '此旅程可能尚未發布或不存在。',
      goToHome: '返回首頁',
      backToFeed: '返回動態',
      viewAndImport: '查看並匯入',
      published: '發布於',
      activities: '個活動',
      noActivitiesInTrip: '此旅程尚未有活動。',
    },
  },
  en: {
    common: {
      loading: 'Loading...',
      error: 'Error',
      success: 'Success',
      cancel: 'Cancel',
      save: 'Save',
      delete: 'Delete',
      edit: 'Edit',
      view: 'View',
      create: 'Create',
      update: 'Update',
      confirm: 'Confirm',
      back: 'Back',
      next: 'Next',
      submit: 'Submit',
      search: 'Search',
      filter: 'Filter',
      close: 'Close',
      createSuccess: 'Create Success',
    },
    nav: {
      dashboard: 'My Trips',
      explore: 'Explore',
      analytics: 'Analytics',
      login: 'Login',
      signUp: 'Sign Up',
      logout: 'Logout',
      guestMode: 'Guest Mode',
      myTrips: 'My Trips',
    },
    landing: {
      title: '🧭 TripCircle',
      subtitle: 'Plan your trips together with friends',
      goToDashboard: 'Go to Dashboard',
      login: 'Login',
      signUp: 'Sign Up',
      continueWithoutLogin: 'Continue without login',
    },
    auth: {
      signIn: 'Sign in',
      signInTo: 'Sign in to TripCircle',
      createAccount: 'Create your account',
      email: 'Email',
      password: 'Password',
      name: 'Name',
      emailAddress: 'Email address',
      signInButton: 'Sign in',
      signingIn: 'Signing in...',
      signUpButton: 'Sign up',
      creatingAccount: 'Creating account...',
      orContinueWith: 'Or continue with',
      google: 'Google',
      dontHaveAccount: "Don't have an account? Sign up",
      alreadyHaveAccount: 'Already have an account? Sign in',
      loginFailed: 'Login failed',
      registrationFailed: 'Registration failed',
    },
    dashboard: {
      myTrips: 'My Trips',
      newTrip: '+ New Trip',
      createTrip: 'Create Trip',
      noTrips: 'No trips yet. Create your first trip!',
      noTripsDesc: 'No trips yet. Create your first trip!',
      status: 'Status',
      role: 'Role',
      browsingAsGuest: 'Browsing as guest - ',
      browsingAsGuestDesc: 'Browsing as guest - ',
      loginToSave: 'Login to save your trips',
      welcomeGuest: "Welcome! You're browsing as a guest.",
      welcomeGuestDesc: 'To create and save trips, please sign up or log in.',
      toCreateTrips: 'To create and save trips, please sign up or log in.',
      youCanExplore: 'You can still explore:',
      explorePlaces: 'Explore Places',
      viewAnalytics: 'View Analytics',
    },
    trip: {
      title: 'Title',
      description: 'Description',
      startDate: 'Start Date',
      endDate: 'End Date',
      coverImage: 'Cover Image',
      coverImageUrl: 'Cover Image URL',
      status: 'Status',
      createTrip: 'Create Trip',
      editTrip: 'Edit Trip',
      editDetails: 'Edit Details',
      deleteTrip: 'Delete Trip',
      deleteConfirm: 'Are you sure you want to delete this trip?',
      tripDetails: 'Trip Details',
      activities: 'Activities',
      members: 'Members',
      share: 'Share',
      invite: 'Invite',
      owner: 'Owner',
      editor: 'Editor',
      viewer: 'Viewer',
      planning: 'Planning',
      upcoming: 'Upcoming',
      ongoing: 'Ongoing',
      active: 'Active',
      completed: 'Completed',
      cancelled: 'Cancelled',
      listView: 'List View',
      calendarView: 'Calendar View',
      dates: 'Dates',
      yourRole: 'Your Role',
      saving: 'Saving...',
      saveChanges: 'Save Changes',
      publishToFeed: 'Publish to Feed',
      publishDescription: 'Share your trip experience with the community',
      published: 'Published',
      draft: 'Draft',
      tripStory: 'Trip Story (for feed)',
      tripStoryPlaceholder: 'Share your trip experience, tips, and highlights...',
      clickToAddStory: 'Click to add your trip story...',
      allowImports: 'Allow imports',
      allowImportsDescription: 'Let others import this trip as a template for their own trips',
      unpublish: 'Unpublish',
      unpublishing: 'Unpublishing...',
      unpublishConfirm: 'Are you sure you want to unpublish this trip?',
      viewInFeed: 'View in Feed →',
      publish: 'Publish',
      publishing: 'Publishing...',
      describePlaceholder: 'Describe your trip...',
    },
    activity: {
      addActivity: 'Add Activity',
      editActivity: 'Edit Activity',
      deleteActivity: 'Delete Activity',
      title: 'Title',
      titleRequired: 'Title *',
      notes: 'Notes',
      location: 'Location',
      locationName: 'Location Name',
      address: 'Address',
      startTime: 'Start Time',
      endTime: 'End Time',
      date: 'Date',
      selectDate: 'Select Date',
      addToTrip: 'Add to Trip',
      add: 'Add',
      selectTrip: 'Select Trip',
      chooseTrip: 'Choose a trip...',
      noActivitiesForDay: 'No activities planned for this day',
      more: 'more',
      addVisitingTime: 'Add visiting time',
      noAssignedTime: 'No assigned time',
      storyForFeed: 'Story (for feed)',
      storyPlaceholder: 'Share your experience at this place when publishing to feed...',
      storyDescription: 'This will be shown when the trip is published',
      quickNotesPlaceholder: 'Quick notes for planning...',
    },
    explore: {
      title: 'Explore Places',
      searchKeyword: 'Search Keyword',
      searchPlaceholder: 'e.g., museums, restaurants, parks',
      location: 'Location (optional)',
      locationPlaceholder: 'e.g., San Francisco, CA',
      results: 'Results',
      map: 'Map',
      noPlacesFound: 'No places found. Try a different search.',
      searching: 'Searching...',
      loginToAdd: 'Login to add to trips',
      googleMapsNotConfigured: 'Google Maps API key not configured',
    },
    admin: {
      analytics: 'Admin Analytics Dashboard',
      authenticationRequired: 'Authentication Required',
      authRequiredDesc: 'Admin analytics are only available to authenticated users.',
      goBack: 'Go Back',
      totalUsers: 'Total Users',
      totalTrips: 'Total Trips',
      tripsOverTime: 'Trips Over Time',
      dailyActiveUsers: 'Daily Active Users',
      exploreUsage: 'Explore Usage',
      shareLinkStats: 'Share Link Stats',
      total: 'Total',
      active: 'Active',
      mostActiveTrips: 'Most Active Trips',
      eventTypeBreakdown: 'Event Type Breakdown',
    },
    share: {
      shareTrip: 'Share Trip',
      createShareLink: 'Create Share Link',
      shareLink: 'Share Link',
      permission: 'Permission',
      viewOnly: 'View Only',
      canEdit: 'Can Edit',
      expiresAt: 'Expires At',
      never: 'Never',
      copyLink: 'Copy Link',
      linkCopied: 'Link Copied',
      sharedTripReadOnly: 'Shared Trip - Read Only',
      importToMyTrips: 'Import to My Trips',
      importing: 'Importing...',
      pleaseLoginToImport: 'Please login to import this trip',
      tripImportedSuccess: 'Trip "{title}" imported successfully!',
      failedToImport: 'Failed to import trip',
      itinerary: 'Itinerary',
      noActivitiesPlanned: 'No activities planned yet.',
    },
    members: {
      members: 'Members',
      inviteMember: 'Invite Member',
      email: 'Email',
      role: 'Role',
      selectRole: 'Select Role',
      remove: 'Remove',
      invite: 'Invite',
      inviting: 'Inviting...',
      failedToInvite: 'Failed to invite member',
      removeConfirm: 'Are you sure you want to remove this member?',
    },
    feed: {
      discoverTrips: 'Discover Trips',
      exploreDescription: 'Explore travel experiences shared by the community',
      noTripsYet: 'No trips yet',
      beFirstToShare: 'Be the first to share your travel experience!',
      moreActivities: 'more',
      previous: 'Previous',
      next: 'Next',
      page: 'Page',
      of: 'of',
      tripNotFound: 'Trip not found',
      tripNotFoundDesc: 'This trip may not be published or doesn\'t exist.',
      goToHome: 'Go to Home',
      backToFeed: 'Back to Feed',
      viewAndImport: 'View & Import',
      published: 'Published',
      activities: 'activities',
      noActivitiesInTrip: 'No activities in this trip yet.',
    },
  },
}

