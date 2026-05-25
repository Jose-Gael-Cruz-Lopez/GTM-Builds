export const LOCALES = ["es", "en"] as const;
export type Locale = (typeof LOCALES)[number];

// ---------------------------------------------------------------------------
// Dictionary shape — every locale object must satisfy this type.
// To add a third language: create its object, add to LOCALES + dictionaries.
// ---------------------------------------------------------------------------

export type Dictionary = {
  nav: {
    product: string;
    cases: string;
    pricing: string;
    blog: string;
    businesses: string;
    customers: string;
  };
  hero: {
    eyebrow: string;
    heading1: string;
    heading2: string;
    body: string;
    ctaBusiness: string;
    ctaConsumer: string;
  };
  notFound: {
    title: string;
    description: string;
    back: string;
  };
  locale: {
    label: string;
    es: string;
    en: string;
  };
  authSplit: {
    eyebrow: string;
    footer: string;
  };
  login: {
    headline: string;
    subtitle: string;
    title: string;
    newHere: string;
    createAccount: string;
    passwordLabel: string;
    showPassword: string;
    hidePassword: string;
    forgotPassword: string;
    submit: string;
    errorTitle: string;
    resetSuccess: string;
    emailInvalid: string;
    passwordMin: string;
    accessStep: string;
    submitArrow: string;
  };
  signup: {
    headline1: string;
    headline2: string;
    subtitle1: string;
    subtitle2: string;
    step1Title: string;
    step2Title: string;
    confirmLabel: string;
    businessNameLabel: string;
    businessNamePlaceholder: string;
    categoryLabel: string;
    planLabel: string;
    continueBtn: string;
    backBtn: string;
    createBtn: string;
    alreadyHaveAccount: string;
    goToLogin: string;
    emailInvalid: string;
    passwordMin: string;
    confirmMismatch: string;
    businessNameShort: string;
    categoryRequired: string;
    planFreeDesc: string;
    planProDesc: string;
    awaitHeadline: string;
    awaitSubtitle: string;
    awaitTitle: string;
    awaitBodyPre: string;
    awaitBodyPost: string;
    errorCreate: string;
    errorRateLimit: string;
    accountCreated: string;
    googleContinue: string;
    useEmailPassword: string;
    businessStepLabel: string;
    confirmStepLabel: string;
    businessCreated: string;
    createBtnArrow: string;
  };
  forgotPassword: {
    headline: string;
    subtitle: string;
    title: string;
    submit: string;
    backToLogin: string;
    sentTitle: string;
    sentBodyPre: string;
    sentBodyMid: string;
    sentBodyPost: string;
    resend: string;
    emailInvalid: string;
    errorSend: string;
  };
  resetPassword: {
    headline: string;
    subtitle: string;
    title: string;
    newPasswordLabel: string;
    confirmLabel: string;
    submit: string;
    errorMin: string;
    errorMismatch: string;
    errorUpdate: string;
  };
  userRegister: {
    back: string;
    eyebrow: string;
    title: string;
    subtitle: string;
    phoneLabel: string;
    phonePlaceholder: string;
    referralLabel: string;
    referralOptional: string;
    referralPlaceholder: string;
    phoneInvalid: string;
    submit: string;
    ownerCta: string;
    ownerLink: string;
    successMsg: string;
    errorMsg: string;
  };
  landing: {
    aboutAriaLabel: string;
    diaryRecent: string;
    aboutParagraph1: string;
    aboutParagraph2: string;
    aboutParagraph3: string;
    scrollStackAriaLabel: string;
    panelEyebrow: string;
    download: string;
    recentAddingsAriaLabel: string;
    colors: string;
    explore: string;
    footerMadeIn: string;
    footerRights: string;
    footerContact: {
      office: string;
      officeLine: string;
      support: string;
      supportLine: string;
      product: string;
      productLine: string;
    };
    footerGroups: {
      product: {
        heading: string;
        features: string;
        pricing: string;
        demo: string;
        changes: string;
      };
      company: { heading: string; about: string; diary: string; contact: string; work: string };
      legal: { heading: string; terms: string; privacy: string; cookies: string };
    };
    citrine: {
      title: string;
      description: string;
      placeholder: string;
      ariaLabel: string;
      submit: string;
      successMsg: string;
      ariaOpen: string;
    };
    scrollToExplore: string;
    showcases: {
      cafeteria: { chipLabel: string; name: string };
      retail: { chipLabel: string; name: string };
    };
    panels: {
      cafeteria: { chipLabel: string; headline: string; ctaLabel: string; pdfTitle: string };
      retail: { chipLabel: string; headline: string; ctaLabel: string; pdfTitle: string };
      salon: { chipLabel: string; headline: string; ctaLabel: string; pdfTitle: string };
      restaurante: { chipLabel: string; headline: string; ctaLabel: string; pdfTitle: string };
      servicios: { chipLabel: string; headline: string; ctaLabel: string; pdfTitle: string };
    };
  };
  appShell: {
    myPanel: string;
    myWallet: string;
    signOut: string;
    signOutLabel: string;
    signIn: string;
    createAccount: string;
    myAccount: string;
  };
  scan: {
    loading: string;
    pendingSync: string;
    synced: string;
    simulationMode: string;
    yourBusiness: string;
    idle: string;
    idleDetail: string;
    validating: string;
    validatingDetail: string;
    stampAdded: string;
    stampsForReward: string;
    rewardReady: string;
    codeExpired: string;
    codeUsed: string;
    invalidKey: string;
    cameraDenied: string;
    offlineQueued: string;
    offlineDetail: string;
    liveIdle: string;
    liveValidating: string;
    liveStamp: string;
    liveReward: string;
    liveExpired: string;
    liveUsed: string;
    liveInvalidKey: string;
    liveCameraDenied: string;
    liveOffline: string;
    settingsLabel: string;
    staffKeyLabel: string;
    staffKeyTitle: string;
    staffKeyDescription: string;
    staffKeyFieldLabel: string;
    staffKeySave: string;
    staffKeyClear: string;
    staffKeyInvalidFormat: string;
    staffKeySaved: string;
    staffKeyError: string;
    cameraTitle: string;
    cameraDescription: string;
    cameraActivate: string;
  };
  userDashboard: {
    hello: string;
    showQr: string;
    renewsIn: string;
    renewNow: string;
    inviteFriends: string;
    shareCode: string;
    myDiscounts: string;
    expires: string;
    active: string;
    expiringSoon: string;
    codeRenewed: string;
    codeCopied: string;
    home: string;
    discount1: string;
    discount2: string;
    discount3: string;
  };
  wallet: {
    title: string;
    setupWallet: string;
    tellUsYourName: string;
    fullName: string;
    yourName: string;
    continue: string;
    loyaltyPrograms: string;
    noPrograms: string;
    startFirst: string;
    welcome: string;
    haveCode: string;
    joinPlaceholder: string;
    join: string;
    myProfile: string;
    signOut: string;
    dialogTitle: string;
    dialogDescription: string;
    save: string;
    profileEyebrow: string;
    yourInfo: string;
    email: string;
    saveChanges: string;
    dangerZone: string;
    dangerDescription: string;
    signOutBtn: string;
    profileSaved: string;
    profileError: string;
    back: string;
    active: string;
    stampsRemaining: string;
    showQr: string;
    history: string;
    lastVisits: string;
    totalVisits: string;
    noVisits: string;
    presentCode: string;
    closeLabel: string;
    visitQr: string;
    momentAgo: string;
    minutesAgo: string;
    hoursAgo: string;
    daysAgo: string;
    stampBadge: string;
    demo: string;
    goBack: string;
    demoTitle: string;
    demoDescription: string;
    stampsMissing: string;
    refresh: string;
    presentCodeCountdown: string;
    statsSummary: string;
  };
  join: {
    programLabel: string;
    yourReward: string;
    defaultBusinessName: string;
    defaultReward: string;
    defaultClientName: string;
    joinTitle: string;
    accumulateStamps: string;
    tryDemo: string;
    alreadyMember: string;
    joinNow: string;
    ownerQuestion: string;
    createAccount: string;
    login: string;
    walletFollows: string;
    createAccountBtn: string;
    haveAccount: string;
    nameLabel: string;
    notFound: string;
    notFoundDescription: string;
    notFoundBack: string;
    checkEmail: string;
    joinError: string;
    categories: {
      barbershop: string;
      salon: string;
      vet: string;
      cafe: string;
      gym: string;
      other: string;
    };
  };
  dashboard: {
    nav: {
      resumen: string;
      sucursales: string;
      clientes: string;
      visitas: string;
      recompensas: string;
      campanas: string;
      marketing: string;
      config: string;
      signOut: string;
      inviteClients: string;
    };
    hello: string;
    generateCampaign: string;
    generateCampaignShort: string;
    visitsToday: string;
    activeClients: string;
    rewards30d: string;
    retention60d: string;
    healthy: string;
    noData: string;
    noDataDescription: string;
    forbidden: string;
    forbiddenDescription: string;
    signIn: string;
    backToHome: string;
    openMenu: string;
    inviteClients: string;
    clientsTitle: string;
    clientsDescription: string;
    clientsEmpty: string;
    clientsEmptyDescription: string;
    copyJoinLink: string;
    clientTable: {
      client: string;
      stamps: string;
      status: string;
      lastVisit: string;
      visits: string;
    };
    statusLabels: { active: string; at_risk: string; lost: string };
    filterAll: string;
    filterActive: string;
    filterAtRisk: string;
    filterLost: string;
    sortLastVisit: string;
    sortTotalVisits: string;
    sortStamps: string;
    searchPlaceholder: string;
    page: string;
    prev: string;
    next: string;
    seeDetail: string;
    generatePersonalCampaign: string;
    clientStatus: string;
    clientStamps: string;
    clientTotalVisits: string;
    generateCampaignForClient: string;
    unavailableTitle: string;
    unavailableDescription: string;
    goToPanel: string;
    sendFeedback: string;
    visitsTitle: string;
    visitsDescription: string;
    rewardsOnly: string;
    noVisitsInRange: string;
    noVisitsDescription: string;
    visitTable: {
      date: string;
      client: string;
      stamps: string;
      reward: string;
    };
    rewardUnlocked: string;
    rewardsTitle: string;
    rewardsDescription: string;
    pendingOnly: string;
    noRewards: string;
    noRewardsDescription: string;
    rewardDelivered: string;
    rewardPending: string;
    markDelivered: string;
    rewardTable: {
      client: string;
      reward: string;
      unlocked: string;
      status: string;
      action: string;
    };
    rewardMarkedDelivered: string;
    rewardUpdateError: string;
    churnTitle: string;
    churnDescription: string;
    bulkCampaign: string;
    churnEmpty: string;
    churnEmptyDescription: string;
    churnTable: {
      client: string;
      daysSince: string;
      totalVisits: string;
      score: string;
      status: string;
    };
    segmentsTitle: string;
    segmentActive: string;
    segmentAtRisk: string;
    segmentLost: string;
    newLast30d: string;
    weeklyInsightEyebrow: string;
    weeklyInsightTitle: string;
    weeklyInsightCta: string;
    weeklyInsightDefault: string;
    visitsChartTitle: string;
    visitsChartSuffix: string;
    retentionTitle: string;
    retentionDescription: string;
    peakHoursTitle: string;
    peakHoursDescription: string;
    analyticsEmptyTitle: string;
    analyticsEmptyDescription: string;
    vsYesterday: string;
  };
  campaigns: {
    title: string;
    totalCampaigns: string;
    oneCampaign: string;
    noMessage: string;
    generateAi: string;
    filterAll: string;
    filterDraft: string;
    filterActive: string;
    filterSent: string;
    filterArchived: string;
    loading: string;
    nothingHere: string;
    backLink: string;
    statusDraft: string;
    statusActive: string;
    statusSent: string;
    statusArchived: string;
    edit: string;
    activate: string;
    sendWhatsApp: string;
    archive: string;
    activated: string;
    archived: string;
    markedSent: string;
    editTitle: string;
    editDescription: string;
    editTitleLabel: string;
    editMessageLabel: string;
    editSegmentLabel: string;
    editTimingLabel: string;
    editLiftLabel: string;
    editScheduleNote: string;
    editCancel: string;
    editSave: string;
    editSaving: string;
    editSaved: string;
    variablesLabel: string;
    emptyTitle: string;
    emptyDescription: string;
    audienceTitle: string;
    audienceCalculating: string;
    audienceSendTo: string;
    audienceFirst5: string;
    audienceEmpty: string;
    audienceCancel: string;
    audienceConfirm: string;
    audienceActivating: string;
    markSentTitle: string;
    markSentDescription: string;
    markSentNo: string;
    markSentConfirm: string;
    markSentSaving: string;
    statsLoading: string;
    statsPreparation: string;
    statsPreparationDetail: string;
    statsSent: string;
    statsOpenRate: string;
    statsRedemptions: string;
    generationTitle: string;
    generationDescription: string;
    step1Question: string;
    customSegmentLabel: string;
    customSegmentPlaceholder: string;
    audienceCount: string;
    audienceCountSingle: string;
    objectiveLabel: string;
    objectivePlaceholder: string;
    toneLabel: string;
    generating: string;
    draftsGenerated: string;
    draftsFallback: string;
    generateDrafts: string;
    clickToGenerate: string;
    back: string;
    next: string;
    close: string;
  };
  settings: {
    title: string;
    businessSettings: string;
    configOf: string;
    backToPanel: string;
    tabs: {
      general: string;
      loyalty: string;
      staff: string;
      account: string;
    };
    tabsAriaLabel: string;
    generalTitle: string;
    generalDescription: string;
    bizNameLabel: string;
    bizCategoryLabel: string;
    bizTaglineLabel: string;
    bizColorLabel: string;
    bizLogoLabel: string;
    bizAddressLabel: string;
    bizPhoneLabel: string;
    bizPhonePlaceholder: string;
    bizTaglinePlaceholder: string;
    saveChanges: string;
    saved: string;
    saveFailed: string;
    dangerZone: string;
    dangerDescription: string;
    pauseBusiness: string;
    deleteBusiness: string;
    pauseTitle: string;
    pauseDescription: string;
    pauseConfirm: string;
    deleteStep1Title: string;
    deleteStep1Description: string;
    deleteStep1Confirm: string;
    deleteStep2Title: string;
    deleteStep2Description: string;
    deleteStep2Confirm: string;
    deleteStep2Placeholder: string;
    paused: string;
    deleted: string;
    cancel: string;
    loyaltyTitle: string;
    loyaltyDescription: string;
    loyaltyWarning: string;
    stampsRequired: string;
    stampsRange: string;
    rewardDescLabel: string;
    rewardDescPlaceholder: string;
    preview: string;
    saveProgram: string;
    programSaved: string;
    staffTitle: string;
    staffDescription: string;
    createKey: string;
    noKeys: string;
    noKeysDescription: string;
    keyLabel: string;
    keyColumn: string;
    createdColumn: string;
    lastUsedColumn: string;
    statusColumn: string;
    actionsColumn: string;
    keyActive: string;
    keyRevoked: string;
    revokeKey: string;
    revokeTitle: string;
    revokeDescription: string;
    revokeConfirm: string;
    revokeCancel: string;
    revoked: string;
    createKeyTitle: string;
    createKeyDescription: string;
    createKeyLabel: string;
    createKeyPlaceholder: string;
    createKeyGenerate: string;
    createKeyCancel: string;
    keyCreatedTitle: string;
    keyCreatedWarning: string;
    keyRawLabel: string;
    keyHeaderLabel: string;
    keyCreatedClose: string;
    copyToClipboard: string;
    copyHeader: string;
    labelRequired: string;
    copyFailed: string;
    never: string;
    accountPasswordTitle: string;
    newPasswordLabel: string;
    confirmPasswordLabel: string;
    updatePassword: string;
    passwordUpdated: string;
    passwordError: string;
    passwordMin: string;
    passwordMismatch: string;
    accountEmailTitle: string;
    currentEmail: string;
    newEmailLabel: string;
    saveEmail: string;
    emailUpdated: string;
    emailError: string;
    accountSessionsTitle: string;
    accountSessionsDescription: string;
    signOutAll: string;
    deleteAccountTitle: string;
    deleteAccountDescription: string;
    deleteAccountBtn: string;
    deleteAccountDialogTitle: string;
    deleteAccountDialogDescription: string;
    deleteAccountDialogPlaceholder: string;
    deleteAccountDialogConfirm: string;
    deleteAccountClosed: string;
    deleteAccountError: string;
    helpGeneral: { title: string; body: string };
    helpLoyalty: { title: string; body: string };
    helpStaff: { title: string; body: string };
    helpAccount: { title: string; body: string };
  };
  onboarding: {
    welcomeEyebrow: string;
    welcomeTitle: string;
    welcomeTitleNamed: string;
    welcomeBody: string;
    welcomeBodyNamed: string;
    stepBrand: string;
    stepReward: string;
    stepShare: string;
    progressLabel: string;
    brandTitle: string;
    brandDescription: string;
    logoLabel: string;
    taglineLabel: string;
    taglinePlaceholder: string;
    taglineChars: string;
    exitToHome: string;
    continue: string;
    saving: string;
    rewardTitle: string;
    rewardDescription: string;
    visitsRequired: string;
    visitsRecommend: string;
    rewardLabel: string;
    rewardPlaceholder: string;
    rewardMax: string;
    back: string;
    saveAndContinue: string;
    rewardSaved: string;
    rewardError: string;
    programActive: string;
    brandSavedLocalHint: string;
    finishTitle: string;
    finishDescription: string;
    shareTitle: string;
    shareBody: string;
    shareWhatsApp: string;
    printQrTitle: string;
    printQrBody: string;
    staffKeyTitle: string;
    staffKeyBody: string;
    staffKeyGenerating: string;
    staffKeyError: string;
    staffKeySaveWarning: string;
    copyKey: string;
    downloadPng: string;
    downloadPdf: string;
    goToPanel: string;
    copySuccess: string;
    copyKeySuccess: string;
    qrDownloaded: string;
    pdfDownloaded: string;
    brandSaved: string;
    brandSavedLocal: string;
    brandError: string;
    logoAlt: string;
    logoUpload: string;
    logoChange: string;
    logoRemove: string;
    logoSizeHint: string;
    cropTitle: string;
    cropDescription: string;
    cropCancel: string;
    cropUse: string;
    cropUploading: string;
    cropSizeError: string;
    cropTypeError: string;
    cropUploadError: string;
    logoUploaded: string;
    cardPreviewLabel: string;
    cardActive: string;
    onboardingLabel: string;
  };
  legal: {
    eyebrow: string;
    privacyTitle: string;
    termsTitle: string;
    lastUpdated: string;
    privacyIntro: string;
    privacySection1: string;
    privacySection1Item1: string;
    privacySection1Item2: string;
    privacySection1Item3: string;
    privacySection2: string;
    privacySection2Body: string;
    privacySection3: string;
    privacySection3Body: string;
    termsIntro: string;
    termsSection1: string;
    termsSection1Body: string;
    termsSection2: string;
    termsSection2Body: string;
    termsSection3: string;
    termsSection3Body: string;
  };
  routeError: {
    title: string;
    description: string;
    retry: string;
    goHome: string;
  };
  common: {
    close: string;
    cancel: string;
    confirm: string;
    save: string;
    edit: string;
    delete: string;
    loading: string;
    error: string;
    success: string;
    back: string;
    next: string;
    previous: string;
    search: string;
    filter: string;
    all: string;
    none: string;
    copyLink: string;
    linkCopied: string;
    copyFailed: string;
    orDivider: string;
  };
};

// ---------------------------------------------------------------------------
// Spanish
// ---------------------------------------------------------------------------

const es: Dictionary = {
  nav: {
    product: "Producto",
    cases: "Casos",
    pricing: "Precios",
    blog: "Diario",
    businesses: "Negocios",
    customers: "Clientes",
  },
  hero: {
    eyebrow: "Plataforma de lealtad digital · México",
    heading1: "Tarjetas de sellos y QR",
    heading2: "para que vuelvan solos.",
    body: "NexoLeal conecta tu negocio con clientes recurrentes: tarjeta digital en el celular, escaneo en mostrador y un panel para ver quién vuelve. Sin app propia. Sin plástico.",
    ctaBusiness: "Negocios",
    ctaConsumer: "Clientes",
  },
  notFound: {
    title: "Página no encontrada",
    description: "El enlace que seguiste ya no existe o nunca existió.",
    back: "Volver al inicio",
  },
  locale: {
    label: "Idioma",
    es: "Español",
    en: "English",
  },
  authSplit: {
    eyebrow: "Lealtad digital",
    footer: "© NexoLeal · Hecho en México",
  },
  login: {
    headline: "Bienvenido de vuelta.",
    subtitle: "Tus clientes te esperan. Inicia sesión para ver cómo van.",
    title: "Iniciar sesión",
    newHere: "¿Eres nuevo?",
    createAccount: "Crea tu cuenta gratis",
    passwordLabel: "Contraseña",
    showPassword: "Mostrar contraseña",
    hidePassword: "Ocultar contraseña",
    forgotPassword: "¿Olvidaste tu contraseña?",
    submit: "Entrar",
    errorTitle: "No pudimos iniciar sesión",
    resetSuccess: "Contraseña actualizada. Inicia sesión.",
    emailInvalid: "Email inválido",
    passwordMin: "Mínimo 6 caracteres",
    accessStep: "Acceso",
    submitArrow: "Entrar →",
  },
  signup: {
    headline1: "Empecemos.",
    headline2: "Cuéntanos de tu negocio.",
    subtitle1: "Entra con Google en un clic. Sin contraseñas, sin fricción.",
    subtitle2: "Esto aparecerá en la cartera digital de tus clientes.",
    step1Title: "Paso 1 · Cuenta",
    step2Title: "Paso 2 · Tu negocio",
    confirmLabel: "Confirmar contraseña",
    businessNameLabel: "Nombre del negocio",
    businessNamePlaceholder: "La Barbería Sur",
    categoryLabel: "Categoría",
    planLabel: "Plan",
    continueBtn: "Continuar",
    backBtn: "Atrás",
    createBtn: "Crear negocio",
    alreadyHaveAccount: "¿Ya tienes cuenta?",
    goToLogin: "Inicia sesión",
    emailInvalid: "Email inválido",
    passwordMin: "Mínimo 8 caracteres",
    confirmMismatch: "Las contraseñas no coinciden",
    businessNameShort: "Demasiado corto",
    categoryRequired: "Elige una categoría",
    planFreeDesc: "Hasta 100 clientes",
    planProDesc: "Ilimitado + IA",
    awaitHeadline: "Revisa tu correo.",
    awaitSubtitle: "Confirma tu cuenta para terminar la creación de tu negocio.",
    awaitTitle: "Te enviamos un enlace",
    awaitBodyPre: "Abre el correo en",
    awaitBodyPost:
      "y haz clic en el botón de confirmación. Cuando regreses, tu negocio se creará automáticamente.",
    errorCreate: "No pudimos crear tu cuenta",
    errorRateLimit:
      "No podemos enviar el correo de confirmación ahora mismo (límite del proveedor). Espera unos minutos e inténtalo otra vez.",
    accountCreated: "Cuenta creada",
    googleContinue: "Continuar con Google",
    useEmailPassword: "Usar email y contraseña",
    businessStepLabel: "Tu negocio",
    confirmStepLabel: "Confirma tu cuenta",
    businessCreated: "Negocio creado",
    createBtnArrow: "Crear negocio →",
  },
  forgotPassword: {
    headline: "¿Olvidaste tu contraseña?",
    subtitle: "Te enviamos un enlace para crear una nueva en segundos.",
    title: "Recuperar acceso",
    submit: "Enviar enlace",
    backToLogin: "Volver a iniciar sesión",
    sentTitle: "Te enviamos un enlace.",
    sentBodyPre: "Revisa",
    sentBodyMid: ". Si no llega, intenta de nuevo en",
    sentBodyPost: "s.",
    resend: "Reenviar",
    emailInvalid: "Email inválido",
    errorSend: "No pudimos enviar el correo",
  },
  resetPassword: {
    headline: "Crea una nueva contraseña.",
    subtitle: "Tu cuenta seguirá lista cuando termines.",
    title: "Nueva contraseña",
    newPasswordLabel: "Nueva contraseña",
    confirmLabel: "Confirmar contraseña",
    submit: "Guardar contraseña",
    errorMin: "La contraseña debe tener al menos 8 caracteres",
    errorMismatch: "Las contraseñas no coinciden",
    errorUpdate: "No pudimos actualizar tu contraseña",
  },
  userRegister: {
    back: "Regresar",
    eyebrow: "Cliente NexoLeal",
    title: "Únete al programa",
    subtitle: "Solo necesitamos tu número para identificarte en cada visita.",
    phoneLabel: "Número de celular",
    phonePlaceholder: "10 dígitos, ej. 5512345678",
    referralLabel: "Código de invitación",
    referralOptional: "(opcional)",
    referralPlaceholder: "ej. REF-SOFI-1234",
    phoneInvalid: "Ingresa 10 dígitos sin espacios ni guiones",
    submit: "Obtener mi código",
    ownerCta: "¿Eres dueño de un negocio?",
    ownerLink: "Crea tu programa de lealtad",
    successMsg: "¡Listo! Ya puedes usar tu código.",
    errorMsg: "No pudimos registrarte. Intenta de nuevo.",
  },
  landing: {
    aboutAriaLabel: "Sobre NexoLeal",
    diaryRecent: "Diario reciente",
    aboutParagraph1:
      "NexoLeal es software de fidelidad para negocios locales: tarjetas de sellos digitales, QR en mostrador y un panel para tu equipo.",
    aboutParagraph2:
      "Tus clientes guardan su tarjeta en el celular. Tu staff valida cada visita con un escáner. Tú ves quién vuelve y quién se está yendo.",
    aboutParagraph3:
      "Sin app que descargar, sin tarjetas de cartón y sin hojas de cálculo. Solo un programa claro que hace que volver sea lo más fácil.",
    scrollStackAriaLabel: "Casos de uso de NexoLeal",
    panelEyebrow: "Hecho para volver",
    download: "Descargar",
    recentAddingsAriaLabel: "Dos formas de fidelizar",
    colors: "Colores",
    explore: "Explorar",
    footerMadeIn: "Hecho en México · 2026",
    footerRights: "© 2026 NexoLeal. Todos los derechos reservados.",
    footerContact: {
      office: "Oficina",
      officeLine: "Ciudad de México, México",
      support: "Soporte",
      supportLine: "Respuesta en menos de 24 horas",
      product: "Producto",
      productLine: "Empieza gratis en minutos",
    },
    footerGroups: {
      product: {
        heading: "Producto",
        features: "Características",
        pricing: "Precios",
        demo: "Demo",
        changes: "Cambios",
      },
      company: {
        heading: "Empresa",
        about: "Sobre",
        diary: "Diario",
        contact: "Contacto",
        work: "Trabaja con nosotros",
      },
      legal: { heading: "Legal", terms: "Términos", privacy: "Privacidad", cookies: "Cookies" },
    },
    citrine: {
      title: "Hablemos",
      description: "Cuéntanos en qué te ayudamos. Te respondemos en menos de 24 horas.",
      placeholder: "Cuéntanos en qué te ayudamos…",
      ariaLabel: "Tu mensaje",
      submit: "Enviar",
      successMsg: "Te respondemos en menos de 24 horas",
      ariaOpen: "Abrir chat de soporte",
    },
    scrollToExplore: "Desplaza para explorar",
    showcases: {
      cafeteria: { chipLabel: "Cafetería", name: "Tarjeta de Sellos · Plaza" },
      retail: { chipLabel: "Retail", name: "QR de Mostrador · Palmer" },
    },
    panels: {
      cafeteria: {
        chipLabel: "Cafetería",
        headline: "Programas de fidelidad que devuelven al cliente, taza tras taza",
        ctaLabel: "Empezar gratis",
        pdfTitle: "Guía Cafetería",
      },
      retail: {
        chipLabel: "Retail",
        headline: "Convierte la primera compra en la primera de muchas",
        ctaLabel: "Empezar gratis",
        pdfTitle: "Guía Retail",
      },
      salon: {
        chipLabel: "Salón",
        headline: "Recordatorios y recompensas que llenan tu agenda",
        ctaLabel: "Empezar gratis",
        pdfTitle: "Guía Salón",
      },
      restaurante: {
        chipLabel: "Restaurante",
        headline: "De comensal a cliente recurrente, sin descuentos que duelan",
        ctaLabel: "Empezar gratis",
        pdfTitle: "Guía Restaurante",
      },
      servicios: {
        chipLabel: "Servicios",
        headline: "Profesionales que recuerdan a cada cliente, sin spreadsheets",
        ctaLabel: "Empezar gratis",
        pdfTitle: "Guía Servicios",
      },
    },
  },
  appShell: {
    myPanel: "Mi panel",
    myWallet: "Mi cartera",
    signOut: "Salir",
    signOutLabel: "Cerrar sesión",
    signIn: "Iniciar sesión",
    createAccount: "Crear cuenta",
    myAccount: "Mi cuenta",
  },
  scan: {
    loading: "Cargando escáner...",
    pendingSync: "{n} visita(s) pendiente(s) de sincronizar",
    synced: "{n} visita(s) sincronizada(s)",
    simulationMode: "Modo simulación:",
    yourBusiness: "Tu negocio",
    idle: "Listo",
    idleDetail: "Listo para escanear · Acerca el QR del cliente.",
    validating: "Validando...",
    validatingDetail: "Validando código...",
    stampAdded: "Sello agregado a {name}",
    stampsForReward: "{n} sellos para la recompensa.",
    rewardReady: "¡Recompensa lista! Entrega: {description}",
    codeExpired: "Código expirado. Pide al cliente generar uno nuevo.",
    codeUsed: "Este código ya fue usado.",
    invalidKey: "Llave de staff inválida. Actualízala en configuración.",
    cameraDenied: "Permiso de cámara denegado",
    offlineQueued: "Sin conexión — visita en cola",
    offlineDetail: "Se registrará automáticamente al reconectar.",
    liveIdle: "Listo para escanear. Acerca el QR del cliente.",
    liveValidating: "Validando código.",
    liveStamp: "Sello agregado a {name}. {n} sellos para la recompensa.",
    liveReward: "Recompensa lista. Entrega: {description}.",
    liveExpired: "Código expirado. Pide al cliente generar uno nuevo.",
    liveUsed: "Este código ya fue usado.",
    liveInvalidKey: "Llave de staff inválida.",
    liveCameraDenied: "Permiso de cámara denegado.",
    liveOffline: "Sin conexión. Visita en cola.",
    settingsLabel: "Configuración",
    staffKeyLabel: "Configurar llave de staff",
    staffKeyTitle: "Llave de staff",
    staffKeyDescription:
      "Se guarda solo en este dispositivo (IndexedDB). Pégala tal como te la entregó el dueño del negocio.",
    staffKeyFieldLabel: "Llave del staff",
    staffKeySave: "Guardar llave",
    staffKeyClear: "Borrar llave de este dispositivo",
    staffKeyInvalidFormat: "Formato inválido. Debe ser <businessId>:<key>",
    staffKeySaved: "Llave guardada en este dispositivo",
    staffKeyError: "No se pudo guardar la llave",
    cameraTitle: "Necesitamos acceso a la cámara",
    cameraDescription:
      "Activa la cámara para escanear los códigos QR de tus clientes en el mostrador.",
    cameraActivate: "Activar cámara",
  },
  userDashboard: {
    hello: "Hola,",
    showQr: "Muéstrale este QR al negocio",
    renewsIn: "Se renueva en {n}s",
    renewNow: "Renovar ahora",
    inviteFriends: "Invitar amigos",
    shareCode: "Comparte tu código y gana recompensas cuando se registren.",
    myDiscounts: "Mis descuentos",
    expires: "Vence:",
    active: "Activo",
    expiringSoon: "Por vencer",
    codeRenewed: "Código renovado",
    codeCopied: "Código copiado",
    home: "Inicio",
    discount1: "10% en tu próxima compra",
    discount2: "Café gratis al acumular 5 visitas",
    discount3: "2x1 en bebidas los martes",
  },
  wallet: {
    title: "Mi cartera",
    setupWallet: "Configura tu cartera",
    tellUsYourName: "Cuéntanos cómo te llamas para crear tu perfil.",
    fullName: "Nombre completo",
    yourName: "Tu nombre",
    continue: "Continuar",
    loyaltyPrograms: "Tus programas de lealtad",
    noPrograms: "Aún no perteneces a ningún programa.",
    startFirst: "Empieza tu primera carta",
    welcome: "¡Bienvenido a NexoLeal!",
    haveCode: "¿Tienes un código?",
    joinPlaceholder: "ID del negocio o enlace de invitación",
    join: "Unirme",
    myProfile: "Mi perfil",
    signOut: "Cerrar sesión",
    dialogTitle: "Cuéntanos tu nombre",
    dialogDescription: "Aparecerá cuando el staff escanee tu QR.",
    save: "Guardar",
    profileEyebrow: "Mi perfil",
    yourInfo: "Tu información",
    email: "Email",
    saveChanges: "Guardar cambios",
    dangerZone: "Zona de peligro",
    dangerDescription: "Cerrar sesión te llevará al inicio. Tus cartas seguirán guardadas.",
    signOutBtn: "Cerrar sesión",
    profileSaved: "Perfil actualizado",
    profileError: "No pudimos guardar",
    back: "Mi cartera",
    active: "Activo",
    stampsRemaining: "Te faltan {n} sellos",
    showQr: "Mostrar QR para sellar",
    history: "Historial",
    lastVisits: "Tus últimas visitas",
    totalVisits: "Total de visitas:",
    noVisits: "Aún no tienes visitas registradas. ¡Pasa por el negocio y muestra tu QR!",
    presentCode: "Presenta este código en caja.",
    closeLabel: "Cerrar",
    visitQr: "Tu QR de visita",
    momentAgo: "Hace un momento",
    minutesAgo: "Hace {n} min",
    hoursAgo: "Hace {n} h",
    daysAgo: "Hace {n} días",
    stampBadge: "+1 sello",
    demo: "Demo",
    goBack: "Volver",
    demoTitle: "Esto es una demo",
    demoDescription:
      "En tu cuenta real, este QR se renueva cada 90 segundos y solo se puede escanear una vez.",
    stampsMissing: "Te faltan {n} sellos",
    refresh: "Refrescar",
    presentCodeCountdown:
      "Presenta este código en caja. {n}s restantes — se renueva automáticamente.",
    statsSummary: "Total de visitas: {visits} · Recompensas: {rewards}",
  },
  join: {
    programLabel: "Programa de lealtad",
    yourReward: "Tu recompensa",
    defaultBusinessName: "Tu negocio favorito",
    defaultReward: "Una recompensa especial",
    defaultClientName: "Cliente",
    joinTitle: "Únete al programa de lealtad de {name}.",
    accumulateStamps: "Acumula {n} sellos y gana",
    tryDemo: "Probar la demo",
    alreadyMember: "Ya eres miembro · Abrir mi cartera",
    joinNow: "Unirme ahora",
    ownerQuestion: "¿Eres dueño de este negocio?",
    createAccount: "Crea tu cuenta",
    login: "Inicia sesión",
    walletFollows: "Tu cartera digital te seguirá a cualquier negocio que use NexoLeal.",
    createAccountBtn: "Crear cuenta",
    haveAccount: "Ya tengo cuenta",
    nameLabel: "Nombre",
    notFound: "Negocio no encontrado",
    notFoundDescription: "El enlace ya no es válido o el programa de lealtad fue desactivado.",
    notFoundBack: "Volver al inicio",
    checkEmail: "Revisa tu correo para confirmar tu cuenta",
    joinError: "No pudimos unirte",
    categories: {
      barbershop: "Barbería",
      salon: "Salón",
      vet: "Veterinaria",
      cafe: "Cafetería",
      gym: "Gimnasio",
      other: "Negocio",
    },
  },
  dashboard: {
    nav: {
      resumen: "Resumen",
      sucursales: "Sucursales",
      clientes: "Clientes",
      visitas: "Visitas",
      recompensas: "Recompensas",
      campanas: "Campañas",
      marketing: "Marketing",
      config: "Configuración",
      signOut: "Cerrar sesión",
      inviteClients: "Invitar clientes",
    },
    hello: "Hola,",
    generateCampaign: "Generar campaña con IA",
    generateCampaignShort: "Campaña IA",
    visitsToday: "Visitas hoy",
    activeClients: "Clientes activos",
    rewards30d: "Recompensas (30d)",
    retention60d: "Retención (60d)",
    healthy: "Saludable",
    noData: "Aún no tienes datos",
    noDataDescription:
      "Comparte tu QR con tus clientes y empezarás a ver visitas y métricas aquí en cuanto registren su primer escaneo.",
    forbidden: "No tienes acceso a este negocio",
    forbiddenDescription: "Esta cuenta no es la dueña del panel que intentas abrir.",
    signIn: "Iniciar sesión",
    backToHome: "Volver al inicio",
    openMenu: "Abrir menú",
    inviteClients: "Invitar clientes",
    clientsTitle: "Clientes",
    clientsDescription: "Administra tu base de clientes y genera campañas personalizadas.",
    clientsEmpty: "Aún no tienes clientes registrados",
    clientsEmptyDescription: "Comparte tu enlace de invitación para empezar.",
    copyJoinLink: "Copiar enlace de invitación",
    clientTable: {
      client: "Cliente",
      stamps: "Sellos",
      status: "Estado",
      lastVisit: "Última visita",
      visits: "Visitas",
    },
    statusLabels: { active: "Activo", at_risk: "En riesgo", lost: "Perdido" },
    filterAll: "Todos",
    filterActive: "Activos",
    filterAtRisk: "En riesgo",
    filterLost: "Perdidos",
    sortLastVisit: "Última visita",
    sortTotalVisits: "Total visitas",
    sortStamps: "Sellos",
    searchPlaceholder: "Buscar por nombre…",
    page: "Página {n}",
    prev: "Anterior",
    next: "Siguiente",
    seeDetail: "Ver detalle",
    generatePersonalCampaign: "Generar campaña personal",
    clientStatus: "Estado",
    clientStamps: "Sellos",
    clientTotalVisits: "Visitas totales",
    generateCampaignForClient: "Generar campaña para este cliente",
    unavailableTitle: "Función en preparación",
    unavailableDescription:
      "Estamos terminando esta vista. Mientras tanto, ve los datos resumidos en el panel principal.",
    goToPanel: "Ir al panel",
    sendFeedback: "Enviar feedback",
    visitsTitle: "Visitas",
    visitsDescription: "Feed en tiempo real de escaneos en caja.",
    rewardsOnly: "Solo recompensas",
    noVisitsInRange: "Aún no se registran visitas en este rango",
    noVisitsDescription:
      "Cuando tu staff escanee códigos QR, las visitas aparecerán aquí al instante.",
    visitTable: {
      date: "Fecha",
      client: "Cliente",
      stamps: "Sellos",
      reward: "Recompensa",
    },
    rewardUnlocked: "Desbloqueada",
    rewardsTitle: "Recompensas",
    rewardsDescription: "Recompensas desbloqueadas por tus clientes al completar sellos.",
    pendingOnly: "Solo pendientes de entregar",
    noRewards: "Aún no hay recompensas",
    noRewardsDescription:
      "Cuando un cliente complete sus sellos, la recompensa aparecerá aquí para que la entregues en caja.",
    rewardDelivered: "Entregada",
    rewardPending: "Pendiente",
    markDelivered: "Marcar entregada",
    rewardTable: {
      client: "Cliente",
      reward: "Recompensa",
      unlocked: "Desbloqueada",
      status: "Estado",
      action: "Acción",
    },
    rewardMarkedDelivered: "Recompensa marcada como entregada",
    rewardUpdateError: "No pudimos actualizar la recompensa",
    churnTitle: "Clientes en riesgo",
    churnDescription: "Top 10 clientes ordenados por probabilidad de no volver.",
    bulkCampaign: "Generar campaña para todos",
    churnEmpty: "Ningún cliente en riesgo por ahora",
    churnEmptyDescription: "¡Buen trabajo! Sigue fidelizando a tus clientes activos.",
    churnTable: {
      client: "Cliente",
      daysSince: "Días sin visita",
      totalVisits: "Visitas totales",
      score: "Score",
      status: "Estado",
    },
    segmentsTitle: "Segmentos de clientes",
    segmentActive: "Activos",
    segmentAtRisk: "En riesgo",
    segmentLost: "Perdidos",
    newLast30d: "nuevos (30d)",
    weeklyInsightEyebrow: "Insight de la semana",
    weeklyInsightTitle: "Lo que tus datos dicen hoy",
    weeklyInsightCta: "Generar campaña basada en este insight",
    weeklyInsightDefault:
      "Comparte tu enlace con clientes para descubrir patrones de visita esta semana.",
    visitsChartTitle: "Visitas",
    visitsChartSuffix: "/día",
    retentionTitle: "Retención",
    retentionDescription: "Cohortes de {n} clientes · ventanas 30/60/90 días",
    peakHoursTitle: "Horas pico",
    peakHoursDescription: "{n} visitas analizadas (90d)",
    analyticsEmptyTitle: "Aún no tenemos suficientes datos",
    analyticsEmptyDescription:
      "Comparte tu enlace con clientes y vuelve pronto para ver tendencias y patrones.",
    vsYesterday: "vs ayer",
  },
  campaigns: {
    title: "Campañas",
    totalCampaigns: "{n} campañas en total.",
    oneCampaign: "1 campaña en total.",
    noMessage: "Conecta con tus clientes y mide el impacto de cada mensaje.",
    generateAi: "Generar con IA",
    filterAll: "Todas",
    filterDraft: "Borradores",
    filterActive: "Activas",
    filterSent: "Enviadas",
    filterArchived: "Archivadas",
    loading: "Cargando campañas...",
    nothingHere: "Nada por aquí todavía.",
    backLink: "Panel",
    statusDraft: "Borrador",
    statusActive: "Activa",
    statusSent: "Enviada",
    statusArchived: "Archivada",
    edit: "Editar",
    activate: "Activar",
    sendWhatsApp: "Enviar por WhatsApp",
    archive: "Archivar",
    activated: "Campaña activada",
    archived: "Archivada",
    markedSent: "Campaña marcada como enviada",
    editTitle: "Editar campaña",
    editDescription: "Ajusta el mensaje, el segmento y los detalles antes de enviar.",
    editTitleLabel: "Título",
    editMessageLabel: "Mensaje",
    editSegmentLabel: "Segmento objetivo",
    editTimingLabel: "Cuándo enviar",
    editLiftLabel: "Lift esperado",
    editScheduleNote: "La programación automática llegará pronto.",
    editCancel: "Cancelar",
    editSave: "Guardar cambios",
    editSaving: "Guardando...",
    editSaved: "Cambios guardados",
    variablesLabel: "Variables disponibles:",
    emptyTitle: "Genera tu primera campaña en 60 segundos",
    emptyDescription:
      "Elige un segmento, define tu objetivo y deja que la IA redacte mensajes listos para enviar por WhatsApp.",
    audienceTitle: "Vista previa de audiencia",
    audienceCalculating: "Calculando audiencia...",
    audienceSendTo: "Esta campaña se enviará a",
    audienceFirst5: " Estos son los primeros 5:",
    audienceEmpty:
      "No hay clientes en este segmento todavía. Puedes activar la campaña y enviarla cuando tengas audiencia.",
    audienceCancel: "Cancelar",
    audienceConfirm: "Confirmar",
    audienceActivating: "Activando...",
    markSentTitle: "¿Enviaste la campaña?",
    markSentDescription:
      "Si ya compartiste el mensaje por WhatsApp, márcala como enviada para llevar el control de tus campañas.",
    markSentNo: "Todavía no",
    markSentConfirm: "Marcar como enviada",
    markSentSaving: "Guardando...",
    statsLoading: "Cargando métricas...",
    statsPreparation: "Métricas en preparación",
    statsPreparationDetail: "Pronto podrás ver aperturas, clics y conversiones de esta campaña.",
    statsSent: "Enviados",
    statsOpenRate: "Apertura",
    statsRedemptions: "Canjes",
    generationTitle: "Generar con IA",
    generationDescription:
      "Hola — vamos a crear mensajes que reconecten con tus clientes. Paso {step} de 3.",
    step1Question:
      "¿A quién quieres llegar? Elige un segmento ilustrado o describe uno personalizado.",
    customSegmentLabel: "Segmento personalizado (opcional)",
    customSegmentPlaceholder: "Ej: clientes que cumplen años esta semana",
    audienceCount: "{n} clientes {segment} recibirán esta campaña.",
    audienceCountSingle: "1 cliente {segment} recibirá esta campaña.",
    objectiveLabel: "Objetivo de la campaña",
    objectivePlaceholder: "Queremos que regresen esta semana...",
    toneLabel: "Tono del mensaje",
    generating: "Generando...",
    draftsGenerated: "¡3 campañas generadas con {model}!",
    draftsFallback: "Generamos 3 plantillas. (IA no disponible — usamos fallback)",
    generateDrafts: "Generar borradores",
    clickToGenerate: "Pulsa generar para crear tus borradores.",
    back: "Atrás",
    next: "Siguiente",
    close: "Cerrar",
  },
  settings: {
    title: "Configuración",
    businessSettings: "Ajustes del negocio",
    configOf: "Configuración de {name}",
    backToPanel: "Panel",
    tabs: {
      general: "General",
      loyalty: "Programa de lealtad",
      staff: "Staff y dispositivos",
      account: "Cuenta",
    },
    tabsAriaLabel: "Secciones de configuración",
    generalTitle: "Información general",
    generalDescription: "Lo que ven tus clientes en su tarjeta de lealtad.",
    bizNameLabel: "Nombre del negocio",
    bizCategoryLabel: "Categoría",
    bizTaglineLabel: "Tagline",
    bizColorLabel: "Color primario",
    bizLogoLabel: "Logo",
    bizAddressLabel: "Dirección (opcional)",
    bizPhoneLabel: "Teléfono de contacto",
    bizPhonePlaceholder: "+52 55 1234 5678",
    bizTaglinePlaceholder: "Tu café favorito en el barrio",
    saveChanges: "Guardar cambios",
    saved: "Configuración guardada",
    saveFailed: "No pudimos guardar",
    dangerZone: "Zona de peligro",
    dangerDescription:
      "Pausar oculta tu negocio de nuevos clientes. Eliminar desactiva el programa de forma permanente.",
    pauseBusiness: "Pausar negocio",
    deleteBusiness: "Eliminar negocio",
    pauseTitle: "¿Pausar tu negocio?",
    pauseDescription:
      "Los clientes existentes conservan sus sellos, pero no podrás registrar nuevas visitas hasta reactivarlo.",
    pauseConfirm: "Pausar",
    deleteStep1Title: "¿Eliminar este negocio?",
    deleteStep1Description:
      "Esta acción desactiva tu programa de lealtad. Tus clientes ya no podrán acumular sellos.",
    deleteStep1Confirm: "Continuar",
    deleteStep2Title: "Confirmación final",
    deleteStep2Description: 'Escribe ELIMINAR para confirmar la eliminación de "{name}".',
    deleteStep2Confirm: "Eliminar definitivamente",
    deleteStep2Placeholder: "ELIMINAR",
    paused: "Negocio pausado",
    deleted: "Negocio eliminado",
    cancel: "Cancelar",
    loyaltyTitle: "Programa de lealtad",
    loyaltyDescription: "Define cuántas visitas se necesitan para la recompensa.",
    loyaltyWarning: "Cambiar el número de sellos no afecta a clientes existentes en curso.",
    stampsRequired: "Sellos requeridos",
    stampsRange: "Entre 3 y 20 visitas",
    rewardDescLabel: "Descripción de la recompensa",
    rewardDescPlaceholder: "Ej: Café gratis en tu próxima visita",
    preview: "Vista previa",
    saveProgram: "Guardar programa",
    programSaved: "Programa de lealtad actualizado",
    staffTitle: "Staff y dispositivos",
    staffDescription: "Claves para el escáner en mostrador. Cada dispositivo necesita la suya.",
    createKey: "Crear nueva clave",
    noKeys: "Aún no hay claves. Crea una para conectar tu primer dispositivo.",
    noKeysDescription: "",
    keyLabel: "Etiqueta",
    keyColumn: "Clave",
    createdColumn: "Creada",
    lastUsedColumn: "Último uso",
    statusColumn: "Estado",
    actionsColumn: "Acciones",
    keyActive: "Activa",
    keyRevoked: "Revocada",
    revokeKey: "Revocar",
    revokeTitle: "¿Revocar esta clave?",
    revokeDescription: 'El dispositivo "{label}" dejará de poder registrar visitas de inmediato.',
    revokeConfirm: "Revocar clave",
    revokeCancel: "Cancelar",
    revoked: "Clave revocada",
    createKeyTitle: "Crear nueva clave",
    createKeyDescription: 'Asigna un nombre al dispositivo — por ejemplo, "Mostrador iPad".',
    createKeyLabel: "Etiqueta del dispositivo",
    createKeyPlaceholder: "Mostrador principal",
    createKeyGenerate: "Generar clave",
    createKeyCancel: "Cancelar",
    keyCreatedTitle: "Clave creada",
    keyCreatedWarning: "Guárdala ahora. No la mostraremos otra vez.",
    keyRawLabel: "Clave (raw)",
    keyHeaderLabel: "Header X-Staff-Key",
    keyCreatedClose: "Entendido, la guardé",
    copyToClipboard: "Copiar clave",
    copyHeader: "Copiar header",
    labelRequired: "Escribe una etiqueta para la clave",
    copyFailed: "No pudimos copiar",
    never: "Nunca",
    accountPasswordTitle: "Cambiar contraseña",
    newPasswordLabel: "Nueva contraseña",
    confirmPasswordLabel: "Confirmar contraseña",
    updatePassword: "Actualizar contraseña",
    passwordUpdated: "Contraseña actualizada",
    passwordError: "No pudimos cambiar la contraseña",
    passwordMin: "La contraseña debe tener al menos 8 caracteres",
    passwordMismatch: "Las contraseñas no coinciden",
    accountEmailTitle: "Cambiar email",
    currentEmail: "Email actual:",
    newEmailLabel: "Nuevo email",
    saveEmail: "Guardar email",
    emailUpdated: "Revisa tu bandeja para confirmar el nuevo email",
    emailError: "No pudimos cambiar el email",
    accountSessionsTitle: "Sesiones",
    accountSessionsDescription:
      "Cierra sesión en todos los dispositivos donde iniciaste con esta cuenta.",
    signOutAll: "Cerrar sesión en todos lados",
    deleteAccountTitle: "Eliminar cuenta",
    deleteAccountDescription:
      "Esta acción cierra tu sesión y pausa tus negocios. Es irreversible desde la app.",
    deleteAccountBtn: "Eliminar mi cuenta",
    deleteAccountDialogTitle: "¿Eliminar tu cuenta?",
    deleteAccountDialogDescription:
      "Escribe ELIMINAR para confirmar. Perderás acceso al panel de propietario.",
    deleteAccountDialogPlaceholder: "ELIMINAR",
    deleteAccountDialogConfirm: "Eliminar cuenta",
    deleteAccountClosed: "Cuenta cerrada. Contacta soporte si necesitas borrado total de datos.",
    deleteAccountError: "No pudimos completar la eliminación",
    helpGeneral: {
      title: "Datos de tu negocio",
      body: "Esta información aparece en la tarjeta de lealtad y en el escáner del staff. Mantén el nombre y la categoría actualizados para que tus clientes te reconozcan.",
    },
    helpLoyalty: {
      title: "Reglas del programa",
      body: "El número de sellos define cuántas visitas necesita un cliente para la recompensa. Los clientes que ya están en curso conservan su progreso actual.",
    },
    helpStaff: {
      title: "Claves de dispositivo",
      body: "Cada tablet o teléfono del mostrador necesita su propia clave. Revoca las claves que ya no uses — por ejemplo, si un empleado deja el negocio.",
    },
    helpAccount: {
      title: "Tu cuenta de propietario",
      body: "Cambiar el email requiere confirmación por correo. Cerrar sesión en todos los dispositivos te protege si perdiste acceso a uno de ellos.",
    },
  },
  onboarding: {
    welcomeEyebrow: "¡Bienvenido!",
    welcomeTitle: "Configuremos tu negocio",
    welcomeTitleNamed: "Hola, {name}",
    welcomeBody: "Vamos a dejar listo tu programa de lealtad en 2 pasos rápidos.",
    welcomeBodyNamed:
      "Vamos a dejar listo tu programa de lealtad para tu {type} en 2 pasos rápidos.",
    stepBrand: "Marca",
    stepReward: "Recompensa",
    stepShare: "Compartir",
    progressLabel: "Progreso del onboarding",
    brandTitle: "Personaliza tu marca",
    brandDescription: "Elige los colores que verán tus clientes al escanear el QR.",
    logoLabel: "Logo",
    taglineLabel: "Eslogan (opcional)",
    taglinePlaceholder: "Ej. Tu café favorito, más cerca",
    taglineChars: "{n}/60 caracteres",
    exitToHome: "Salir al inicio",
    continue: "Continuar",
    saving: "Guardando…",
    rewardTitle: "Crea tu primera recompensa",
    rewardDescription:
      "Define cuántas visitas necesita un cliente para ganar y la recompensa que recibirá.",
    visitsRequired: "Visitas necesarias",
    visitsRecommend: "Recomendamos entre 8 y 12 visitas para tu primera recompensa.",
    rewardLabel: "Recompensa",
    rewardPlaceholder: "Ej. Servicio gratis",
    rewardMax: "Lo que el cliente recibe al completar las visitas. Máximo 120 caracteres.",
    back: "Volver",
    saveAndContinue: "Guardar y continuar",
    rewardSaved: "Recompensa configurada",
    rewardError: "No pudimos guardar tu recompensa. Intenta de nuevo.",
    programActive: "¡Listo! Tu programa de lealtad está activo.",
    brandSavedLocalHint: "Revisa tu conexión e intenta sincronizar desde Configuración.",
    finishTitle: "¡Tu negocio está listo!",
    finishDescription:
      "Comparte, imprime y configura tu equipo para empezar a sumar clientes frecuentes.",
    shareTitle: "Comparte con tus clientes",
    shareBody: "Envía este enlace para que se unan a tu programa de lealtad.",
    shareWhatsApp: "Compartir por WhatsApp",
    printQrTitle: "Imprime tu QR",
    printQrBody: "Código listo para mostrador o redes sociales.",
    staffKeyTitle: "Configura tu primer staff key",
    staffKeyBody: "Tu personal usará esta llave para escanear códigos QR desde la caja.",
    staffKeyGenerating: "Generando llave…",
    staffKeyError: "No pudimos generar la llave. Recarga la página para intentarlo de nuevo.",
    staffKeySaveWarning: "Guárdalo: solo se muestra una vez.",
    copyKey: "Copiar llave",
    downloadPng: "PNG",
    downloadPdf: "PDF",
    goToPanel: "Ir a mi panel",
    copySuccess: "Enlace copiado",
    copyKeySuccess: "Llave copiada",
    qrDownloaded: "QR descargado",
    pdfDownloaded: "PDF descargado",
    brandSaved: "Marca guardada",
    brandSavedLocal: "Marca guardada localmente",
    brandError: "No pudimos guardar tu marca. Intenta de nuevo.",
    logoAlt: "Logo del negocio",
    logoUpload: "Subir logo",
    logoChange: "Cambiar logo",
    logoRemove: "Quitar",
    logoSizeHint: "PNG o JPG, máximo 1 MB. Se recorta en cuadrado.",
    cropTitle: "Recorta tu logo",
    cropDescription: "Ajusta el encuadre cuadrado para tu tarjeta de lealtad.",
    cropCancel: "Cancelar",
    cropUse: "Usar este logo",
    cropUploading: "Subiendo…",
    cropSizeError: "El logo debe pesar menos de 1 MB",
    cropTypeError: "Selecciona una imagen válida",
    cropUploadError: "No pudimos subir el logo. Intenta de nuevo.",
    logoUploaded: "Logo subido",
    cardPreviewLabel: "Vista previa · Cartera del cliente",
    cardActive: "Activo",
    onboardingLabel: "Onboarding",
  },
  legal: {
    eyebrow: "Legal",
    privacyTitle: "Política de privacidad",
    termsTitle: "Términos de servicio",
    lastUpdated: "Última actualización: 23 de mayo de 2026.",
    privacyIntro:
      "En NexoLeal recolectamos solo los datos necesarios para operar tu programa de lealtad: nombre del negocio, contacto del dueño, y datos básicos de tus clientes para identificar visitas y recompensas.",
    privacySection1: "1. Datos que recolectamos",
    privacySection1Item1: "Información de cuenta (email, contraseña hasheada).",
    privacySection1Item2: "Información del negocio (nombre, categoría, configuración de lealtad).",
    privacySection1Item3: "Información de clientes (nombre, sellos acumulados, fechas de visita).",
    privacySection2: "2. Cómo usamos los datos",
    privacySection2Body:
      "Para operar el servicio, generar campañas con IA y mostrar métricas a los dueños de negocio.",
    privacySection3: "3. Tus derechos",
    privacySection3Body:
      "Puedes solicitar eliminar tu cuenta en cualquier momento desde Configuración.",
    termsIntro:
      "NexoLeal es una plataforma para que pequeñas y medianas empresas administren programas de lealtad digital. Al usar el servicio, aceptas estos términos.",
    termsSection1: "1. Uso del servicio",
    termsSection1Body:
      'El servicio se proporciona "tal cual" durante el periodo MVP. Nos reservamos el derecho de actualizar funciones, precios y disponibilidad.',
    termsSection2: "2. Datos y privacidad",
    termsSection2Body:
      "Consulta nuestra política de privacidad para conocer cómo manejamos los datos de tu negocio y tus clientes.",
    termsSection3: "3. Contacto",
    termsSection3Body: "Cualquier duda: hola@nexoleal.com.",
  },
  routeError: {
    title: "Algo salió mal",
    description: "No pudimos cargar esta página. Intenta de nuevo o vuelve al inicio.",
    retry: "Reintentar",
    goHome: "Ir al inicio",
  },
  common: {
    close: "Cerrar",
    cancel: "Cancelar",
    confirm: "Confirmar",
    save: "Guardar",
    edit: "Editar",
    delete: "Eliminar",
    loading: "Cargando...",
    error: "Error",
    success: "Éxito",
    back: "Atrás",
    next: "Siguiente",
    previous: "Anterior",
    search: "Buscar",
    filter: "Filtrar",
    all: "Todos",
    none: "Ninguno",
    copyLink: "Copiar enlace",
    linkCopied: "Enlace copiado",
    copyFailed: "No pudimos copiar",
    orDivider: "o",
  },
};

// ---------------------------------------------------------------------------
// English
// ---------------------------------------------------------------------------

const en: Dictionary = {
  nav: {
    product: "Product",
    cases: "Cases",
    pricing: "Pricing",
    blog: "Journal",
    businesses: "Businesses",
    customers: "Customers",
  },
  hero: {
    eyebrow: "Digital loyalty platform · Mexico",
    heading1: "Stamp cards and QR codes",
    heading2: "that bring customers back.",
    body: "NexoLeal connects your business with repeat customers: a digital card on their phone, counter scanning for your team, and a dashboard to see who returns. No custom app. No plastic.",
    ctaBusiness: "Businesses",
    ctaConsumer: "Customers",
  },
  notFound: {
    title: "Page not found",
    description: "The link you followed no longer exists or never did.",
    back: "Back to home",
  },
  locale: {
    label: "Language",
    es: "Español",
    en: "English",
  },
  authSplit: {
    eyebrow: "Digital loyalty",
    footer: "© NexoLeal · Made in Mexico",
  },
  login: {
    headline: "Welcome back.",
    subtitle: "Sign in with Google in one click and see how your customers are doing.",
    title: "Log in",
    newHere: "New here?",
    createAccount: "Create a free account",
    passwordLabel: "Password",
    showPassword: "Show password",
    hidePassword: "Hide password",
    forgotPassword: "Forgot your password?",
    submit: "Sign in",
    errorTitle: "Could not sign in",
    resetSuccess: "Password updated. Please sign in.",
    emailInvalid: "Invalid email",
    passwordMin: "At least 6 characters",
    accessStep: "Sign in",
    submitArrow: "Sign in →",
  },
  signup: {
    headline1: "Let's begin.",
    headline2: "Tell us about your business.",
    subtitle1: "Sign in with Google in one click. No passwords, no friction.",
    subtitle2: "This will appear in your customers' digital wallet.",
    step1Title: "Step 1 · Account",
    step2Title: "Step 2 · Your business",
    confirmLabel: "Confirm password",
    businessNameLabel: "Business name",
    businessNamePlaceholder: "The South Barbershop",
    categoryLabel: "Category",
    planLabel: "Plan",
    continueBtn: "Continue",
    backBtn: "Back",
    createBtn: "Create business",
    alreadyHaveAccount: "Already have an account?",
    goToLogin: "Sign in",
    emailInvalid: "Invalid email",
    passwordMin: "At least 8 characters",
    confirmMismatch: "Passwords do not match",
    businessNameShort: "Too short",
    categoryRequired: "Choose a category",
    planFreeDesc: "Up to 100 customers",
    planProDesc: "Unlimited + AI",
    awaitHeadline: "Check your email.",
    awaitSubtitle: "Confirm your account to finish creating your business.",
    awaitTitle: "We sent you a link",
    awaitBodyPre: "Open the email at",
    awaitBodyPost:
      "and click the confirmation button. When you return, your business will be created automatically.",
    errorCreate: "Could not create your account",
    errorRateLimit:
      "We can't send the confirmation email right now (provider rate limit). Wait a few minutes and try again.",
    accountCreated: "Account created",
    googleContinue: "Continue with Google",
    useEmailPassword: "Use email and password",
    businessStepLabel: "Your business",
    confirmStepLabel: "Confirm your account",
    businessCreated: "Business created",
    createBtnArrow: "Create business →",
  },
  forgotPassword: {
    headline: "Forgot your password?",
    subtitle: "We'll send you a link to create a new one in seconds.",
    title: "Recover access",
    submit: "Send link",
    backToLogin: "Back to sign in",
    sentTitle: "We sent you a link.",
    sentBodyPre: "Check",
    sentBodyMid: ". If it doesn't arrive, try again in",
    sentBodyPost: "s.",
    resend: "Resend",
    emailInvalid: "Invalid email",
    errorSend: "Could not send the email",
  },
  resetPassword: {
    headline: "Create a new password.",
    subtitle: "Your account will be ready when you are done.",
    title: "New password",
    newPasswordLabel: "New password",
    confirmLabel: "Confirm password",
    submit: "Save password",
    errorMin: "Password must be at least 8 characters",
    errorMismatch: "Passwords do not match",
    errorUpdate: "Could not update your password",
  },
  userRegister: {
    back: "Go back",
    eyebrow: "NexoLeal Customer",
    title: "Join the program",
    subtitle: "We just need your number to identify you on each visit.",
    phoneLabel: "Mobile number",
    phonePlaceholder: "10 digits, e.g. 5512345678",
    referralLabel: "Invitation code",
    referralOptional: "(optional)",
    referralPlaceholder: "e.g. REF-SOFI-1234",
    phoneInvalid: "Enter 10 digits without spaces or dashes",
    submit: "Get my code",
    ownerCta: "Do you own a business?",
    ownerLink: "Create your loyalty program",
    successMsg: "Done! You can now use your code.",
    errorMsg: "Could not register you. Please try again.",
  },
  landing: {
    aboutAriaLabel: "About NexoLeal",
    diaryRecent: "Recent journal",
    aboutParagraph1:
      "NexoLeal is loyalty software for local businesses: digital stamp cards, counter QR codes, and a dashboard for your team.",
    aboutParagraph2:
      "Customers keep their card on their phone. Staff validates each visit with a scanner. You see who comes back and who is drifting away.",
    aboutParagraph3:
      "No app to download, no cardboard punch cards, no spreadsheets. Just a clear program that makes returning the easy choice.",
    scrollStackAriaLabel: "NexoLeal use cases",
    panelEyebrow: "Built to bring them back",
    download: "Download",
    recentAddingsAriaLabel: "Two ways to build loyalty",
    colors: "Colors",
    explore: "Explore",
    footerMadeIn: "Made in Mexico · 2026",
    footerRights: "© 2026 NexoLeal. All rights reserved.",
    footerContact: {
      office: "Office",
      officeLine: "Mexico City, Mexico",
      support: "Support",
      supportLine: "Reply within 24 hours",
      product: "Product",
      productLine: "Start free in minutes",
    },
    footerGroups: {
      product: {
        heading: "Product",
        features: "Features",
        pricing: "Pricing",
        demo: "Demo",
        changes: "Changelog",
      },
      company: {
        heading: "Company",
        about: "About",
        diary: "Journal",
        contact: "Contact",
        work: "Work with us",
      },
      legal: { heading: "Legal", terms: "Terms", privacy: "Privacy", cookies: "Cookies" },
    },
    citrine: {
      title: "Let's talk",
      description: "Tell us how we can help. We'll get back to you in less than 24 hours.",
      placeholder: "Tell us how we can help…",
      ariaLabel: "Your message",
      submit: "Send",
      successMsg: "We'll get back to you in less than 24 hours",
      ariaOpen: "Open support chat",
    },
    scrollToExplore: "Scroll to explore",
    showcases: {
      cafeteria: { chipLabel: "Coffee shop", name: "Stamp Card · Plaza" },
      retail: { chipLabel: "Retail", name: "Counter QR · Palmer" },
    },
    panels: {
      cafeteria: {
        chipLabel: "Coffee shop",
        headline: "Loyalty programs that bring customers back, cup after cup",
        ctaLabel: "Start free",
        pdfTitle: "Coffee Shop Guide",
      },
      retail: {
        chipLabel: "Retail",
        headline: "Turn the first purchase into the first of many",
        ctaLabel: "Start free",
        pdfTitle: "Retail Guide",
      },
      salon: {
        chipLabel: "Salon",
        headline: "Reminders and rewards that fill your appointment book",
        ctaLabel: "Start free",
        pdfTitle: "Salon Guide",
      },
      restaurante: {
        chipLabel: "Restaurant",
        headline: "From first-timer to regular, without painful discounts",
        ctaLabel: "Start free",
        pdfTitle: "Restaurant Guide",
      },
      servicios: {
        chipLabel: "Services",
        headline: "Professionals who remember every client, without spreadsheets",
        ctaLabel: "Start free",
        pdfTitle: "Services Guide",
      },
    },
  },
  appShell: {
    myPanel: "My panel",
    myWallet: "My wallet",
    signOut: "Sign out",
    signOutLabel: "Sign out",
    signIn: "Sign in",
    createAccount: "Create account",
    myAccount: "My account",
  },
  scan: {
    loading: "Loading scanner...",
    pendingSync: "{n} visit(s) pending sync",
    synced: "{n} visit(s) synced",
    simulationMode: "Simulation mode:",
    yourBusiness: "Your business",
    idle: "Ready",
    idleDetail: "Ready to scan · Bring the customer QR close.",
    validating: "Validating...",
    validatingDetail: "Validating code...",
    stampAdded: "Stamp added to {name}",
    stampsForReward: "{n} stamps until reward.",
    rewardReady: "Reward ready! Deliver: {description}",
    codeExpired: "Code expired. Ask the customer to generate a new one.",
    codeUsed: "This code has already been used.",
    invalidKey: "Invalid staff key. Update it in settings.",
    cameraDenied: "Camera permission denied",
    offlineQueued: "Offline — visit queued",
    offlineDetail: "Will sync automatically when reconnected.",
    liveIdle: "Ready to scan. Bring the customer QR close.",
    liveValidating: "Validating code.",
    liveStamp: "Stamp added to {name}. {n} stamps until reward.",
    liveReward: "Reward ready. Deliver: {description}.",
    liveExpired: "Code expired. Ask the customer to generate a new one.",
    liveUsed: "This code has already been used.",
    liveInvalidKey: "Invalid staff key.",
    liveCameraDenied: "Camera permission denied.",
    liveOffline: "Offline. Visit queued.",
    settingsLabel: "Settings",
    staffKeyLabel: "Configure staff key",
    staffKeyTitle: "Staff key",
    staffKeyDescription:
      "Stored only on this device (IndexedDB). Paste it exactly as provided by the business owner.",
    staffKeyFieldLabel: "Staff key",
    staffKeySave: "Save key",
    staffKeyClear: "Remove key from this device",
    staffKeyInvalidFormat: "Invalid format. Must be <businessId>:<key>",
    staffKeySaved: "Key saved on this device",
    staffKeyError: "Could not save the key",
    cameraTitle: "We need camera access",
    cameraDescription: "Activate the camera to scan your customers QR codes at the counter.",
    cameraActivate: "Activate camera",
  },
  userDashboard: {
    hello: "Hello,",
    showQr: "Show this QR to the business",
    renewsIn: "Renews in {n}s",
    renewNow: "Renew now",
    inviteFriends: "Invite friends",
    shareCode: "Share your code and earn rewards when they sign up.",
    myDiscounts: "My discounts",
    expires: "Expires:",
    active: "Active",
    expiringSoon: "Expiring soon",
    codeRenewed: "Code renewed",
    codeCopied: "Code copied",
    home: "Home",
    discount1: "10% off your next purchase",
    discount2: "Free coffee after 5 visits",
    discount3: "2-for-1 drinks on Tuesdays",
  },
  wallet: {
    title: "My wallet",
    setupWallet: "Set up your wallet",
    tellUsYourName: "Tell us your name to create your profile.",
    fullName: "Full name",
    yourName: "Your name",
    continue: "Continue",
    loyaltyPrograms: "Your loyalty programs",
    noPrograms: "You don't belong to any program yet.",
    startFirst: "Start your first card",
    welcome: "Welcome to NexoLeal!",
    haveCode: "Have a code?",
    joinPlaceholder: "Business ID or invitation link",
    join: "Join",
    myProfile: "My profile",
    signOut: "Sign out",
    dialogTitle: "Tell us your name",
    dialogDescription: "It will appear when staff scans your QR.",
    save: "Save",
    profileEyebrow: "My profile",
    yourInfo: "Your information",
    email: "Email",
    saveChanges: "Save changes",
    dangerZone: "Danger zone",
    dangerDescription: "Signing out will take you to the home page. Your cards will remain saved.",
    signOutBtn: "Sign out",
    profileSaved: "Profile updated",
    profileError: "Could not save",
    back: "My wallet",
    active: "Active",
    stampsRemaining: "{n} stamps remaining",
    showQr: "Show QR to stamp",
    history: "History",
    lastVisits: "Your recent visits",
    totalVisits: "Total visits:",
    noVisits: "You have no visits yet. Stop by the business and show your QR!",
    presentCode: "Present this code at the register.",
    closeLabel: "Close",
    visitQr: "Your visit QR",
    momentAgo: "Just now",
    minutesAgo: "{n} min ago",
    hoursAgo: "{n} h ago",
    daysAgo: "{n} days ago",
    stampBadge: "+1 stamp",
    demo: "Demo",
    goBack: "Back",
    demoTitle: "This is a demo",
    demoDescription:
      "In your real account, this QR renews every 90 seconds and can only be scanned once.",
    stampsMissing: "{n} stamps remaining",
    refresh: "Refresh",
    presentCodeCountdown:
      "Present this code at the register. {n}s remaining — renews automatically.",
    statsSummary: "Total visits: {visits} · Rewards: {rewards}",
  },
  join: {
    programLabel: "Loyalty program",
    yourReward: "Your reward",
    defaultBusinessName: "Your favorite business",
    defaultReward: "A special reward",
    defaultClientName: "Customer",
    joinTitle: "Join the loyalty program at {name}.",
    accumulateStamps: "Collect {n} stamps and earn",
    tryDemo: "Try the demo",
    alreadyMember: "Already a member · Open my wallet",
    joinNow: "Join now",
    ownerQuestion: "Are you the business owner?",
    createAccount: "Create your account",
    login: "Sign in",
    walletFollows: "Your digital wallet will follow you to any business using NexoLeal.",
    createAccountBtn: "Create account",
    haveAccount: "I already have an account",
    nameLabel: "Name",
    notFound: "Business not found",
    notFoundDescription: "The link is no longer valid or the loyalty program was deactivated.",
    notFoundBack: "Back to home",
    checkEmail: "Check your email to confirm your account",
    joinError: "Could not join",
    categories: {
      barbershop: "Barbershop",
      salon: "Salon",
      vet: "Vet",
      cafe: "Coffee shop",
      gym: "Gym",
      other: "Business",
    },
  },
  dashboard: {
    nav: {
      resumen: "Overview",
      sucursales: "Locations",
      clientes: "Clients",
      visitas: "Visits",
      recompensas: "Rewards",
      campanas: "Campaigns",
      marketing: "Marketing",
      config: "Settings",
      signOut: "Sign out",
      inviteClients: "Invite clients",
    },
    hello: "Hello,",
    generateCampaign: "Generate AI campaign",
    generateCampaignShort: "AI Campaign",
    visitsToday: "Visits today",
    activeClients: "Active clients",
    rewards30d: "Rewards (30d)",
    retention60d: "Retention (60d)",
    healthy: "Healthy",
    noData: "No data yet",
    noDataDescription:
      "Share your QR with customers and you will start seeing visits and metrics here as soon as they register their first scan.",
    forbidden: "You do not have access to this business",
    forbiddenDescription: "This account is not the owner of the panel you are trying to open.",
    signIn: "Sign in",
    backToHome: "Back to home",
    openMenu: "Open menu",
    inviteClients: "Invite clients",
    clientsTitle: "Clients",
    clientsDescription: "Manage your customer base and generate personalized campaigns.",
    clientsEmpty: "No registered clients yet",
    clientsEmptyDescription: "Share your invitation link to get started.",
    copyJoinLink: "Copy invitation link",
    clientTable: {
      client: "Client",
      stamps: "Stamps",
      status: "Status",
      lastVisit: "Last visit",
      visits: "Visits",
    },
    statusLabels: { active: "Active", at_risk: "At risk", lost: "Lost" },
    filterAll: "All",
    filterActive: "Active",
    filterAtRisk: "At risk",
    filterLost: "Lost",
    sortLastVisit: "Last visit",
    sortTotalVisits: "Total visits",
    sortStamps: "Stamps",
    searchPlaceholder: "Search by name…",
    page: "Page {n}",
    prev: "Previous",
    next: "Next",
    seeDetail: "View detail",
    generatePersonalCampaign: "Generate personal campaign",
    clientStatus: "Status",
    clientStamps: "Stamps",
    clientTotalVisits: "Total visits",
    generateCampaignForClient: "Generate campaign for this client",
    unavailableTitle: "Feature in progress",
    unavailableDescription:
      "We are finishing this view. In the meantime, see the summary data on the main panel.",
    goToPanel: "Go to panel",
    sendFeedback: "Send feedback",
    visitsTitle: "Visits",
    visitsDescription: "Real-time feed of scans at the counter.",
    rewardsOnly: "Rewards only",
    noVisitsInRange: "No visits recorded in this range yet",
    noVisitsDescription: "When your staff scans QR codes, visits will appear here instantly.",
    visitTable: {
      date: "Date",
      client: "Client",
      stamps: "Stamps",
      reward: "Reward",
    },
    rewardUnlocked: "Unlocked",
    rewardsTitle: "Rewards",
    rewardsDescription: "Rewards unlocked by your customers after completing stamps.",
    pendingOnly: "Pending delivery only",
    noRewards: "No rewards yet",
    noRewardsDescription:
      "When a customer completes their stamps, the reward will appear here for you to deliver at the counter.",
    rewardDelivered: "Delivered",
    rewardPending: "Pending",
    markDelivered: "Mark as delivered",
    rewardTable: {
      client: "Client",
      reward: "Reward",
      unlocked: "Unlocked",
      status: "Status",
      action: "Action",
    },
    rewardMarkedDelivered: "Reward marked as delivered",
    rewardUpdateError: "Could not update the reward",
    churnTitle: "At-risk clients",
    churnDescription: "Top 10 clients sorted by probability of not returning.",
    bulkCampaign: "Generate campaign for all",
    churnEmpty: "No at-risk clients right now",
    churnEmptyDescription: "Great work! Keep engaging your active customers.",
    churnTable: {
      client: "Client",
      daysSince: "Days since visit",
      totalVisits: "Total visits",
      score: "Score",
      status: "Status",
    },
    segmentsTitle: "Customer segments",
    segmentActive: "Active",
    segmentAtRisk: "At risk",
    segmentLost: "Lost",
    newLast30d: "new (30d)",
    weeklyInsightEyebrow: "Weekly insight",
    weeklyInsightTitle: "What your data says today",
    weeklyInsightCta: "Generate campaign based on this insight",
    weeklyInsightDefault: "Share your link with customers to discover visit patterns this week.",
    visitsChartTitle: "Visits",
    visitsChartSuffix: "/day",
    retentionTitle: "Retention",
    retentionDescription: "Cohorts of {n} clients · 30/60/90-day windows",
    peakHoursTitle: "Peak hours",
    peakHoursDescription: "{n} visits analyzed (90d)",
    analyticsEmptyTitle: "Not enough data yet",
    analyticsEmptyDescription:
      "Share your link with customers and come back soon to see trends and patterns.",
    vsYesterday: "vs yesterday",
  },
  campaigns: {
    title: "Campaigns",
    totalCampaigns: "{n} campaigns total.",
    oneCampaign: "1 campaign total.",
    noMessage: "Connect with your customers and measure the impact of each message.",
    generateAi: "Generate with AI",
    filterAll: "All",
    filterDraft: "Drafts",
    filterActive: "Active",
    filterSent: "Sent",
    filterArchived: "Archived",
    loading: "Loading campaigns...",
    nothingHere: "Nothing here yet.",
    backLink: "Panel",
    statusDraft: "Draft",
    statusActive: "Active",
    statusSent: "Sent",
    statusArchived: "Archived",
    edit: "Edit",
    activate: "Activate",
    sendWhatsApp: "Send via WhatsApp",
    archive: "Archive",
    activated: "Campaign activated",
    archived: "Archived",
    markedSent: "Campaign marked as sent",
    editTitle: "Edit campaign",
    editDescription: "Adjust the message, segment and details before sending.",
    editTitleLabel: "Title",
    editMessageLabel: "Message",
    editSegmentLabel: "Target segment",
    editTimingLabel: "When to send",
    editLiftLabel: "Expected lift",
    editScheduleNote: "Automatic scheduling is coming soon.",
    editCancel: "Cancel",
    editSave: "Save changes",
    editSaving: "Saving...",
    editSaved: "Changes saved",
    variablesLabel: "Available variables:",
    emptyTitle: "Generate your first campaign in 60 seconds",
    emptyDescription:
      "Choose a segment, set your objective and let AI draft messages ready to send via WhatsApp.",
    audienceTitle: "Audience preview",
    audienceCalculating: "Calculating audience...",
    audienceSendTo: "This campaign will be sent to",
    audienceFirst5: " Here are the first 5:",
    audienceEmpty:
      "No clients in this segment yet. You can activate the campaign and send it when you have an audience.",
    audienceCancel: "Cancel",
    audienceConfirm: "Confirm",
    audienceActivating: "Activating...",
    markSentTitle: "Did you send the campaign?",
    markSentDescription:
      "If you already shared the message via WhatsApp, mark it as sent to keep track of your campaigns.",
    markSentNo: "Not yet",
    markSentConfirm: "Mark as sent",
    markSentSaving: "Saving...",
    statsLoading: "Loading metrics...",
    statsPreparation: "Metrics in preparation",
    statsPreparationDetail:
      "Soon you will be able to see opens, clicks and conversions for this campaign.",
    statsSent: "Sent",
    statsOpenRate: "Open rate",
    statsRedemptions: "Redemptions",
    generationTitle: "Generate with AI",
    generationDescription:
      "Hi — let's create messages that reconnect with your customers. Step {step} of 3.",
    step1Question:
      "Who do you want to reach? Choose an illustrated segment or describe a custom one.",
    customSegmentLabel: "Custom segment (optional)",
    customSegmentPlaceholder: "E.g.: customers with birthdays this week",
    audienceCount: "{n} {segment} clients will receive this campaign.",
    audienceCountSingle: "1 {segment} client will receive this campaign.",
    objectiveLabel: "Campaign objective",
    objectivePlaceholder: "We want them to come back this week...",
    toneLabel: "Message tone",
    generating: "Generating...",
    draftsGenerated: "3 campaigns generated with {model}!",
    draftsFallback: "We generated 3 templates. (AI unavailable — used fallback)",
    generateDrafts: "Generate drafts",
    clickToGenerate: "Click generate to create your drafts.",
    back: "Back",
    next: "Next",
    close: "Close",
  },
  settings: {
    title: "Settings",
    businessSettings: "Business settings",
    configOf: "Settings for {name}",
    backToPanel: "Panel",
    tabs: {
      general: "General",
      loyalty: "Loyalty program",
      staff: "Staff & devices",
      account: "Account",
    },
    tabsAriaLabel: "Settings sections",
    generalTitle: "General information",
    generalDescription: "What your customers see on their loyalty card.",
    bizNameLabel: "Business name",
    bizCategoryLabel: "Category",
    bizTaglineLabel: "Tagline",
    bizColorLabel: "Primary color",
    bizLogoLabel: "Logo",
    bizAddressLabel: "Address (optional)",
    bizPhoneLabel: "Contact phone",
    bizPhonePlaceholder: "+52 55 1234 5678",
    bizTaglinePlaceholder: "Your neighborhood favorite",
    saveChanges: "Save changes",
    saved: "Settings saved",
    saveFailed: "Could not save",
    dangerZone: "Danger zone",
    dangerDescription:
      "Pausing hides your business from new customers. Deleting permanently deactivates the program.",
    pauseBusiness: "Pause business",
    deleteBusiness: "Delete business",
    pauseTitle: "Pause your business?",
    pauseDescription:
      "Existing customers keep their stamps, but you will not be able to register new visits until you reactivate.",
    pauseConfirm: "Pause",
    deleteStep1Title: "Delete this business?",
    deleteStep1Description:
      "This action deactivates your loyalty program. Your customers will no longer be able to accumulate stamps.",
    deleteStep1Confirm: "Continue",
    deleteStep2Title: "Final confirmation",
    deleteStep2Description: 'Type DELETE to confirm the deletion of "{name}".',
    deleteStep2Confirm: "Delete permanently",
    deleteStep2Placeholder: "DELETE",
    paused: "Business paused",
    deleted: "Business deleted",
    cancel: "Cancel",
    loyaltyTitle: "Loyalty program",
    loyaltyDescription: "Define how many visits are needed for the reward.",
    loyaltyWarning: "Changing the number of stamps does not affect customers already in progress.",
    stampsRequired: "Stamps required",
    stampsRange: "Between 3 and 20 visits",
    rewardDescLabel: "Reward description",
    rewardDescPlaceholder: "E.g.: Free coffee on your next visit",
    preview: "Preview",
    saveProgram: "Save program",
    programSaved: "Loyalty program updated",
    staffTitle: "Staff & devices",
    staffDescription: "Keys for the counter scanner. Each device needs its own.",
    createKey: "Create new key",
    noKeys: "No keys yet. Create one to connect your first device.",
    noKeysDescription: "",
    keyLabel: "Label",
    keyColumn: "Key",
    createdColumn: "Created",
    lastUsedColumn: "Last used",
    statusColumn: "Status",
    actionsColumn: "Actions",
    keyActive: "Active",
    keyRevoked: "Revoked",
    revokeKey: "Revoke",
    revokeTitle: "Revoke this key?",
    revokeDescription: 'The device "{label}" will immediately lose the ability to register visits.',
    revokeConfirm: "Revoke key",
    revokeCancel: "Cancel",
    revoked: "Key revoked",
    createKeyTitle: "Create new key",
    createKeyDescription: 'Assign a name to the device — for example, "Counter iPad".',
    createKeyLabel: "Device label",
    createKeyPlaceholder: "Main counter",
    createKeyGenerate: "Generate key",
    createKeyCancel: "Cancel",
    keyCreatedTitle: "Key created",
    keyCreatedWarning: "Save it now. We won't show it again.",
    keyRawLabel: "Key (raw)",
    keyHeaderLabel: "X-Staff-Key header",
    keyCreatedClose: "Got it, I saved it",
    copyToClipboard: "Copy key",
    copyHeader: "Copy header",
    labelRequired: "Enter a label for the key",
    copyFailed: "Could not copy",
    never: "Never",
    accountPasswordTitle: "Change password",
    newPasswordLabel: "New password",
    confirmPasswordLabel: "Confirm password",
    updatePassword: "Update password",
    passwordUpdated: "Password updated",
    passwordError: "Could not change password",
    passwordMin: "Password must be at least 8 characters",
    passwordMismatch: "Passwords do not match",
    accountEmailTitle: "Change email",
    currentEmail: "Current email:",
    newEmailLabel: "New email",
    saveEmail: "Save email",
    emailUpdated: "Check your inbox to confirm the new email",
    emailError: "Could not change email",
    accountSessionsTitle: "Sessions",
    accountSessionsDescription: "Sign out of all devices where you logged in with this account.",
    signOutAll: "Sign out everywhere",
    deleteAccountTitle: "Delete account",
    deleteAccountDescription:
      "This action signs you out and pauses your businesses. It is irreversible from the app.",
    deleteAccountBtn: "Delete my account",
    deleteAccountDialogTitle: "Delete your account?",
    deleteAccountDialogDescription:
      "Type DELETE to confirm. You will lose access to the owner panel.",
    deleteAccountDialogPlaceholder: "DELETE",
    deleteAccountDialogConfirm: "Delete account",
    deleteAccountClosed: "Account closed. Contact support if you need full data deletion.",
    deleteAccountError: "Could not complete deletion",
    helpGeneral: {
      title: "Your business data",
      body: "This information appears on the loyalty card and the staff scanner. Keep the name and category up to date so your customers recognize you.",
    },
    helpLoyalty: {
      title: "Program rules",
      body: "The number of stamps defines how many visits a customer needs for the reward. Customers already in progress keep their current progress.",
    },
    helpStaff: {
      title: "Device keys",
      body: "Each counter tablet or phone needs its own key. Revoke keys you no longer use — for example, if an employee leaves the business.",
    },
    helpAccount: {
      title: "Your owner account",
      body: "Changing email requires inbox confirmation. Signing out of all devices protects you if you lose access to one of them.",
    },
  },
  onboarding: {
    welcomeEyebrow: "Welcome!",
    welcomeTitle: "Let's set up your business",
    welcomeTitleNamed: "Hello, {name}",
    welcomeBody: "Let's get your loyalty program ready in 2 quick steps.",
    welcomeBodyNamed: "Let's get your loyalty program ready for your {type} in 2 quick steps.",
    stepBrand: "Brand",
    stepReward: "Reward",
    stepShare: "Share",
    progressLabel: "Onboarding progress",
    brandTitle: "Customize your brand",
    brandDescription: "Choose the colors your customers will see when scanning the QR.",
    logoLabel: "Logo",
    taglineLabel: "Tagline (optional)",
    taglinePlaceholder: "E.g. Your neighborhood favorite, closer than ever",
    taglineChars: "{n}/60 characters",
    exitToHome: "Exit to home",
    continue: "Continue",
    saving: "Saving…",
    rewardTitle: "Create your first reward",
    rewardDescription:
      "Define how many visits a customer needs to earn and what reward they will receive.",
    visitsRequired: "Visits required",
    visitsRecommend: "We recommend between 8 and 12 visits for your first reward.",
    rewardLabel: "Reward",
    rewardPlaceholder: "E.g. Free service",
    rewardMax: "What the customer receives after completing visits. Maximum 120 characters.",
    back: "Back",
    saveAndContinue: "Save and continue",
    rewardSaved: "Reward configured",
    rewardError: "Could not save your reward. Please try again.",
    programActive: "Done! Your loyalty program is active.",
    brandSavedLocalHint: "Check your connection and try syncing from Settings.",
    finishTitle: "Your business is ready!",
    finishDescription:
      "Share, print and set up your team to start accumulating frequent customers.",
    shareTitle: "Share with your customers",
    shareBody: "Send this link so they can join your loyalty program.",
    shareWhatsApp: "Share via WhatsApp",
    printQrTitle: "Print your QR",
    printQrBody: "Code ready for the counter or social media.",
    staffKeyTitle: "Set up your first staff key",
    staffKeyBody: "Your staff will use this key to scan QR codes from the counter.",
    staffKeyGenerating: "Generating key…",
    staffKeyError: "Could not generate the key. Reload the page to try again.",
    staffKeySaveWarning: "Save it: it is only shown once.",
    copyKey: "Copy key",
    downloadPng: "PNG",
    downloadPdf: "PDF",
    goToPanel: "Go to my panel",
    copySuccess: "Link copied",
    copyKeySuccess: "Key copied",
    qrDownloaded: "QR downloaded",
    pdfDownloaded: "PDF downloaded",
    brandSaved: "Brand saved",
    brandSavedLocal: "Brand saved locally",
    brandError: "Could not save your brand. Please try again.",
    logoAlt: "Business logo",
    logoUpload: "Upload logo",
    logoChange: "Change logo",
    logoRemove: "Remove",
    logoSizeHint: "PNG or JPG, max 1 MB. Cropped to square.",
    cropTitle: "Crop your logo",
    cropDescription: "Adjust the square frame for your loyalty card.",
    cropCancel: "Cancel",
    cropUse: "Use this logo",
    cropUploading: "Uploading…",
    cropSizeError: "Logo must be under 1 MB",
    cropTypeError: "Select a valid image",
    cropUploadError: "Could not upload the logo. Please try again.",
    logoUploaded: "Logo uploaded",
    cardPreviewLabel: "Preview · Customer wallet",
    cardActive: "Active",
    onboardingLabel: "Onboarding",
  },
  legal: {
    eyebrow: "Legal",
    privacyTitle: "Privacy policy",
    termsTitle: "Terms of service",
    lastUpdated: "Last updated: May 23, 2026.",
    privacyIntro:
      "At NexoLeal we collect only the data necessary to operate your loyalty program: business name, owner contact, and basic customer data to identify visits and rewards.",
    privacySection1: "1. Data we collect",
    privacySection1Item1: "Account information (email, hashed password).",
    privacySection1Item2: "Business information (name, category, loyalty configuration).",
    privacySection1Item3: "Customer information (name, accumulated stamps, visit dates).",
    privacySection2: "2. How we use the data",
    privacySection2Body:
      "To operate the service, generate AI campaigns and display metrics to business owners.",
    privacySection3: "3. Your rights",
    privacySection3Body: "You can request account deletion at any time from Settings.",
    termsIntro:
      "NexoLeal is a platform for small and medium businesses to manage digital loyalty programs. By using the service, you agree to these terms.",
    termsSection1: "1. Use of service",
    termsSection1Body:
      'The service is provided "as is" during the MVP period. We reserve the right to update features, pricing and availability.',
    termsSection2: "2. Data and privacy",
    termsSection2Body:
      "See our privacy policy to learn how we handle your business and customer data.",
    termsSection3: "3. Contact",
    termsSection3Body: "Any questions: hola@nexoleal.com.",
  },
  routeError: {
    title: "Something went wrong",
    description: "We could not load this page. Try again or go back to the home page.",
    retry: "Retry",
    goHome: "Go to home",
  },
  common: {
    close: "Close",
    cancel: "Cancel",
    confirm: "Confirm",
    save: "Save",
    edit: "Edit",
    delete: "Delete",
    loading: "Loading...",
    error: "Error",
    success: "Success",
    back: "Back",
    next: "Next",
    previous: "Previous",
    search: "Search",
    filter: "Filter",
    all: "All",
    none: "None",
    copyLink: "Copy link",
    linkCopied: "Link copied",
    copyFailed: "Could not copy",
    orDivider: "or",
  },
};

// ---------------------------------------------------------------------------

export const dictionaries: Record<Locale, Dictionary> = { es, en };

const STORAGE_KEY = "nexoleal.locale";

export function detectLocale(): Locale {
  if (typeof window === "undefined") return "es";
  const stored = localStorage.getItem(STORAGE_KEY) as Locale | null;
  if (stored && (LOCALES as ReadonlyArray<string>).includes(stored)) return stored;
  return navigator.language.startsWith("es") ? "es" : "en";
}

export function persistLocale(locale: Locale): void {
  localStorage.setItem(STORAGE_KEY, locale);
}
