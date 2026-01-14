import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type Language = 'pt' | 'en' | 'es';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
  formatCurrency: (value: number) => string;
  formatDate: (date: Date | string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

// Translations
const translations: Record<Language, Record<string, string>> = {
  pt: {
    // Login
    'login.welcome': 'Bem-vindo ao Kreato',
    'login.subtitle': 'Sistema de Gestão de Produção',
    'login.user': 'Usuário',
    'login.user.placeholder': 'Digite seu usuário',
    'login.password': 'Senha',
    'login.password.placeholder': 'Digite sua senha',
    'login.submit': 'Entrar no Sistema',
    'login.loading': 'Entrando...',
    'login.error': 'Usuário ou senha inválidos',
    'login.hint': 'Acesso inicial: Admin / kreato',
    
    // Common
    'common.save': 'Salvar',
    'common.cancel': 'Cancelar',
    'common.delete': 'Excluir',
    'common.edit': 'Editar',
    'common.add': 'Adicionar',
    'common.search': 'Buscar...',
    'common.actions': 'Ações',
    'common.yes': 'Sim',
    'common.no': 'Não',
    'common.loading': 'Carregando...',
    'common.success': 'Sucesso',
    'common.error': 'Erro',
    'common.confirm.delete': 'Deseja realmente excluir?',
    'common.noResults': 'Nenhum resultado encontrado',
    'common.code': 'Código',
    'common.externalCode': 'Código Externo',
    'common.name': 'Nome',
    'common.description': 'Descrição',
    'common.status': 'Status',
    'common.date': 'Data',
    'common.user': 'Usuário',
    'common.registrationDate': 'Data de Cadastro',
    'common.registrationUser': 'Usuário de Cadastro',
    'common.total': 'Total',
    'common.quantity': 'Quantidade',
    'common.value': 'Valor',
    'common.observations': 'Observações',
    'common.image': 'Imagem',
    'common.logo': 'Logotipo',
    'common.upload': 'Upload',
    'common.change': 'Alterar',
    'common.remove': 'Remover',
    'common.select': 'Selecione...',
    'common.none': 'Nenhum',
    'common.active': 'Ativo',
    'common.inactive': 'Inativo',
    
    // Theme
    'theme.dark': 'Tema Escuro',
    'theme.light': 'Tema Claro',
    'settings': 'Configurações',
    'language': 'Idioma',
    
    // Menu
    'menu.dashboard': 'Dashboard',
    'menu.production': 'Produção',
    'menu.content': 'Conteúdo',
    'menu.recordings': 'Gravações',
    'menu.maps': 'Mapas',
    'menu.resources': 'Recursos',
    'menu.people': 'Pessoas',
    'menu.humanResources': 'Recursos Humanos',
    'menu.technicalResources': 'Recursos Técnicos',
    'menu.physicalResources': 'Recursos Físicos',
    'menu.suppliers': 'Fornecedores',
    'menu.services': 'Serviços',
    'menu.costumes': 'Figurinos',
    'menu.admin': 'Administração',
    'menu.users': 'Usuários',
    'menu.accessProfiles': 'Perfis de Acesso',
    'menu.businessUnits': 'Unidades de Negócio',
    'menu.profitCenters': 'Centros de Lucro',
    'menu.parameters': 'Parametrizações',
    'menu.logout': 'Sair',
    
    // Business Units
    'businessUnits.title': 'Unidades de Negócio',
    'businessUnits.description': 'Gerencie as unidades de negócio da organização',
    'businessUnits.new': 'Nova Unidade de Negócio',
    'businessUnits.edit': 'Editar Unidade de Negócio',
    'businessUnits.empty': 'Nenhuma unidade de negócio cadastrada',
    'businessUnits.emptyDescription': 'Comece adicionando unidades de negócio para organizar seu sistema.',
    'businessUnits.deleted': 'Unidade de Negócio removida com sucesso!',
    'businessUnits.saved': 'Unidade de Negócio salva com sucesso!',
    'businessUnits.updated': 'Unidade de Negócio atualizada com sucesso!',
    
    // Profit Centers
    'profitCenters.title': 'Centros de Lucro',
    'profitCenters.description': 'Gerencie os centros de lucro da organização',
    
    // Content
    'content.title': 'Conteúdo',
    'content.description': 'Gerencie os conteúdos de produção',
    'content.new': 'Novo Conteúdo',
    'content.edit': 'Editar Conteúdo',
    'content.episodes': 'Episódios',
    'content.synopsis': 'Sinopse',
    'content.productionYear': 'Ano de Produção',
    'content.contentType': 'Tipo de Conteúdo',
    'content.classification': 'Classificação',
    
    // Recordings
    'recordings.title': 'Gravações',
    'recordings.description': 'Gerencie as gravações de produção',
    'recordings.new': 'Nova Gravação',
    'recordings.edit': 'Editar Gravação',
    'recordings.expectedDate': 'Data Prevista',
    'recordings.generalData': 'Dados Gerais',
    'recordings.resources': 'Recursos',
    'recordings.cast': 'Elenco',
    'recordings.guests': 'Convidados',
    'recordings.costumes': 'Figurinos',
    'recordings.thirdParties': 'Terceiros',
    'recordings.costs': 'Custos',
    
    // Cast
    'cast.title': 'Elenco',
    'cast.add': 'Adicionar ao Elenco',
    'cast.person': 'Pessoa',
    'cast.character': 'Personagem',
    'cast.characterDescription': 'Descrição do Personagem',
    'cast.costumes': 'Figurinos do Personagem',
    'cast.actor': 'Ator/Atriz',
    'cast.empty': 'Nenhum membro do elenco adicionado',
    'cast.total': 'membro(s) do elenco',
    
    // Guests
    'guests.title': 'Convidados',
    'guests.add': 'Adicionar Convidado',
    'guests.roleInRecording': 'Função na Gravação',
    'guests.contact': 'Contato',
    'guests.empty': 'Nenhum convidado adicionado',
    'guests.total': 'convidado(s)',
    
    // Costumes
    'costumes.title': 'Figurinos',
    'costumes.description': 'Gerencie os figurinos disponíveis',
    'costumes.new': 'Novo Figurino',
    'costumes.edit': 'Editar Figurino',
    'costumes.code': 'Código do Figurino',
    'costumes.type': 'Tipo de Figurino',
    'costumes.size': 'Tamanho',
    'costumes.primaryColor': 'Cor Predominante',
    'costumes.secondaryColor': 'Cor Secundária',
    'costumes.material': 'Material',
    'costumes.images': 'Imagens',
    'costumes.mainImage': 'Imagem Principal',
    'costumes.empty': 'Nenhum figurino cadastrado',
    
    // People
    'people.title': 'Pessoas',
    'people.description': 'Gerencie o cadastro de pessoas',
    'people.new': 'Nova Pessoa',
    'people.edit': 'Editar Pessoa',
    'people.firstName': 'Nome',
    'people.lastName': 'Sobrenome',
    'people.workName': 'Nome Artístico',
    'people.phone': 'Telefone',
    'people.email': 'E-mail',
    'people.photo': 'Foto',
    
    // Dashboard
    'dashboard.title': 'Dashboard',
    'dashboard.welcome': 'Bem-vindo',
    'dashboard.overview': 'Visão Geral',
    
    // Costs
    'costs.title': 'Custos',
    'costs.estimatedCost': 'Custo Estimado',
    'costs.actualCost': 'Custo Real',
    'costs.dailyRate': 'Diária',
    'costs.hourlyRate': 'Valor Hora',
    'costs.totalCost': 'Custo Total',
    
    // Currency
    'currency.symbol': 'R$',
    'currency.code': 'BRL',
  },
  en: {
    // Login
    'login.welcome': 'Welcome to Kreato',
    'login.subtitle': 'Production Management System',
    'login.user': 'User',
    'login.user.placeholder': 'Enter your user',
    'login.password': 'Password',
    'login.password.placeholder': 'Enter your password',
    'login.submit': 'Sign In',
    'login.loading': 'Signing in...',
    'login.error': 'Invalid user or password',
    'login.hint': 'Initial access: Admin / kreato',
    
    // Common
    'common.save': 'Save',
    'common.cancel': 'Cancel',
    'common.delete': 'Delete',
    'common.edit': 'Edit',
    'common.add': 'Add',
    'common.search': 'Search...',
    'common.actions': 'Actions',
    'common.yes': 'Yes',
    'common.no': 'No',
    'common.loading': 'Loading...',
    'common.success': 'Success',
    'common.error': 'Error',
    'common.confirm.delete': 'Do you really want to delete?',
    'common.noResults': 'No results found',
    'common.code': 'Code',
    'common.externalCode': 'External Code',
    'common.name': 'Name',
    'common.description': 'Description',
    'common.status': 'Status',
    'common.date': 'Date',
    'common.user': 'User',
    'common.registrationDate': 'Registration Date',
    'common.registrationUser': 'Registration User',
    'common.total': 'Total',
    'common.quantity': 'Quantity',
    'common.value': 'Value',
    'common.observations': 'Observations',
    'common.image': 'Image',
    'common.logo': 'Logo',
    'common.upload': 'Upload',
    'common.change': 'Change',
    'common.remove': 'Remove',
    'common.select': 'Select...',
    'common.none': 'None',
    'common.active': 'Active',
    'common.inactive': 'Inactive',
    
    // Theme
    'theme.dark': 'Dark Theme',
    'theme.light': 'Light Theme',
    'settings': 'Settings',
    'language': 'Language',
    
    // Menu
    'menu.dashboard': 'Dashboard',
    'menu.production': 'Production',
    'menu.content': 'Content',
    'menu.recordings': 'Recordings',
    'menu.maps': 'Maps',
    'menu.resources': 'Resources',
    'menu.people': 'People',
    'menu.humanResources': 'Human Resources',
    'menu.technicalResources': 'Technical Resources',
    'menu.physicalResources': 'Physical Resources',
    'menu.suppliers': 'Suppliers',
    'menu.services': 'Services',
    'menu.costumes': 'Costumes',
    'menu.admin': 'Administration',
    'menu.users': 'Users',
    'menu.accessProfiles': 'Access Profiles',
    'menu.businessUnits': 'Business Units',
    'menu.profitCenters': 'Profit Centers',
    'menu.parameters': 'Parameters',
    'menu.logout': 'Logout',
    
    // Business Units
    'businessUnits.title': 'Business Units',
    'businessUnits.description': 'Manage organization business units',
    'businessUnits.new': 'New Business Unit',
    'businessUnits.edit': 'Edit Business Unit',
    'businessUnits.empty': 'No business units registered',
    'businessUnits.emptyDescription': 'Start adding business units to organize your system.',
    'businessUnits.deleted': 'Business Unit deleted successfully!',
    'businessUnits.saved': 'Business Unit saved successfully!',
    'businessUnits.updated': 'Business Unit updated successfully!',
    
    // Profit Centers
    'profitCenters.title': 'Profit Centers',
    'profitCenters.description': 'Manage organization profit centers',
    
    // Content
    'content.title': 'Content',
    'content.description': 'Manage production content',
    'content.new': 'New Content',
    'content.edit': 'Edit Content',
    'content.episodes': 'Episodes',
    'content.synopsis': 'Synopsis',
    'content.productionYear': 'Production Year',
    'content.contentType': 'Content Type',
    'content.classification': 'Classification',
    
    // Recordings
    'recordings.title': 'Recordings',
    'recordings.description': 'Manage production recordings',
    'recordings.new': 'New Recording',
    'recordings.edit': 'Edit Recording',
    'recordings.expectedDate': 'Expected Date',
    'recordings.generalData': 'General Data',
    'recordings.resources': 'Resources',
    'recordings.cast': 'Cast',
    'recordings.guests': 'Guests',
    'recordings.costumes': 'Costumes',
    'recordings.thirdParties': 'Third Parties',
    'recordings.costs': 'Costs',
    
    // Cast
    'cast.title': 'Cast',
    'cast.add': 'Add to Cast',
    'cast.person': 'Person',
    'cast.character': 'Character',
    'cast.characterDescription': 'Character Description',
    'cast.costumes': 'Character Costumes',
    'cast.actor': 'Actor/Actress',
    'cast.empty': 'No cast members added',
    'cast.total': 'cast member(s)',
    
    // Guests
    'guests.title': 'Guests',
    'guests.add': 'Add Guest',
    'guests.roleInRecording': 'Role in Recording',
    'guests.contact': 'Contact',
    'guests.empty': 'No guests added',
    'guests.total': 'guest(s)',
    
    // Costumes
    'costumes.title': 'Costumes',
    'costumes.description': 'Manage available costumes',
    'costumes.new': 'New Costume',
    'costumes.edit': 'Edit Costume',
    'costumes.code': 'Costume Code',
    'costumes.type': 'Costume Type',
    'costumes.size': 'Size',
    'costumes.primaryColor': 'Primary Color',
    'costumes.secondaryColor': 'Secondary Color',
    'costumes.material': 'Material',
    'costumes.images': 'Images',
    'costumes.mainImage': 'Main Image',
    'costumes.empty': 'No costumes registered',
    
    // People
    'people.title': 'People',
    'people.description': 'Manage people registry',
    'people.new': 'New Person',
    'people.edit': 'Edit Person',
    'people.firstName': 'First Name',
    'people.lastName': 'Last Name',
    'people.workName': 'Stage Name',
    'people.phone': 'Phone',
    'people.email': 'Email',
    'people.photo': 'Photo',
    
    // Dashboard
    'dashboard.title': 'Dashboard',
    'dashboard.welcome': 'Welcome',
    'dashboard.overview': 'Overview',
    
    // Costs
    'costs.title': 'Costs',
    'costs.estimatedCost': 'Estimated Cost',
    'costs.actualCost': 'Actual Cost',
    'costs.dailyRate': 'Daily Rate',
    'costs.hourlyRate': 'Hourly Rate',
    'costs.totalCost': 'Total Cost',
    
    // Currency
    'currency.symbol': '$',
    'currency.code': 'USD',
  },
  es: {
    // Login
    'login.welcome': 'Bienvenido a Kreato',
    'login.subtitle': 'Sistema de Gestión de Producción',
    'login.user': 'Usuario',
    'login.user.placeholder': 'Ingrese su usuario',
    'login.password': 'Contraseña',
    'login.password.placeholder': 'Ingrese su contraseña',
    'login.submit': 'Iniciar Sesión',
    'login.loading': 'Iniciando...',
    'login.error': 'Usuario o contraseña inválidos',
    'login.hint': 'Acceso inicial: Admin / kreato',
    
    // Common
    'common.save': 'Guardar',
    'common.cancel': 'Cancelar',
    'common.delete': 'Eliminar',
    'common.edit': 'Editar',
    'common.add': 'Agregar',
    'common.search': 'Buscar...',
    'common.actions': 'Acciones',
    'common.yes': 'Sí',
    'common.no': 'No',
    'common.loading': 'Cargando...',
    'common.success': 'Éxito',
    'common.error': 'Error',
    'common.confirm.delete': '¿Realmente desea eliminar?',
    'common.noResults': 'No se encontraron resultados',
    'common.code': 'Código',
    'common.externalCode': 'Código Externo',
    'common.name': 'Nombre',
    'common.description': 'Descripción',
    'common.status': 'Estado',
    'common.date': 'Fecha',
    'common.user': 'Usuario',
    'common.registrationDate': 'Fecha de Registro',
    'common.registrationUser': 'Usuario de Registro',
    'common.total': 'Total',
    'common.quantity': 'Cantidad',
    'common.value': 'Valor',
    'common.observations': 'Observaciones',
    'common.image': 'Imagen',
    'common.logo': 'Logotipo',
    'common.upload': 'Subir',
    'common.change': 'Cambiar',
    'common.remove': 'Eliminar',
    'common.select': 'Seleccione...',
    'common.none': 'Ninguno',
    'common.active': 'Activo',
    'common.inactive': 'Inactivo',
    
    // Theme
    'theme.dark': 'Tema Oscuro',
    'theme.light': 'Tema Claro',
    'settings': 'Configuración',
    'language': 'Idioma',
    
    // Menu
    'menu.dashboard': 'Panel',
    'menu.production': 'Producción',
    'menu.content': 'Contenido',
    'menu.recordings': 'Grabaciones',
    'menu.maps': 'Mapas',
    'menu.resources': 'Recursos',
    'menu.people': 'Personas',
    'menu.humanResources': 'Recursos Humanos',
    'menu.technicalResources': 'Recursos Técnicos',
    'menu.physicalResources': 'Recursos Físicos',
    'menu.suppliers': 'Proveedores',
    'menu.services': 'Servicios',
    'menu.costumes': 'Vestuarios',
    'menu.admin': 'Administración',
    'menu.users': 'Usuarios',
    'menu.accessProfiles': 'Perfiles de Acceso',
    'menu.businessUnits': 'Unidades de Negocio',
    'menu.profitCenters': 'Centros de Beneficio',
    'menu.parameters': 'Parámetros',
    'menu.logout': 'Salir',
    
    // Business Units
    'businessUnits.title': 'Unidades de Negocio',
    'businessUnits.description': 'Gestione las unidades de negocio de la organización',
    'businessUnits.new': 'Nueva Unidad de Negocio',
    'businessUnits.edit': 'Editar Unidad de Negocio',
    'businessUnits.empty': 'No hay unidades de negocio registradas',
    'businessUnits.emptyDescription': 'Comience agregando unidades de negocio para organizar su sistema.',
    'businessUnits.deleted': '¡Unidad de Negocio eliminada con éxito!',
    'businessUnits.saved': '¡Unidad de Negocio guardada con éxito!',
    'businessUnits.updated': '¡Unidad de Negocio actualizada con éxito!',
    
    // Profit Centers
    'profitCenters.title': 'Centros de Beneficio',
    'profitCenters.description': 'Gestione los centros de beneficio de la organización',
    
    // Content
    'content.title': 'Contenido',
    'content.description': 'Gestione los contenidos de producción',
    'content.new': 'Nuevo Contenido',
    'content.edit': 'Editar Contenido',
    'content.episodes': 'Episodios',
    'content.synopsis': 'Sinopsis',
    'content.productionYear': 'Año de Producción',
    'content.contentType': 'Tipo de Contenido',
    'content.classification': 'Clasificación',
    
    // Recordings
    'recordings.title': 'Grabaciones',
    'recordings.description': 'Gestione las grabaciones de producción',
    'recordings.new': 'Nueva Grabación',
    'recordings.edit': 'Editar Grabación',
    'recordings.expectedDate': 'Fecha Prevista',
    'recordings.generalData': 'Datos Generales',
    'recordings.resources': 'Recursos',
    'recordings.cast': 'Elenco',
    'recordings.guests': 'Invitados',
    'recordings.costumes': 'Vestuarios',
    'recordings.thirdParties': 'Terceros',
    'recordings.costs': 'Costos',
    
    // Cast
    'cast.title': 'Elenco',
    'cast.add': 'Agregar al Elenco',
    'cast.person': 'Persona',
    'cast.character': 'Personaje',
    'cast.characterDescription': 'Descripción del Personaje',
    'cast.costumes': 'Vestuarios del Personaje',
    'cast.actor': 'Actor/Actriz',
    'cast.empty': 'Ningún miembro del elenco agregado',
    'cast.total': 'miembro(s) del elenco',
    
    // Guests
    'guests.title': 'Invitados',
    'guests.add': 'Agregar Invitado',
    'guests.roleInRecording': 'Función en la Grabación',
    'guests.contact': 'Contacto',
    'guests.empty': 'Ningún invitado agregado',
    'guests.total': 'invitado(s)',
    
    // Costumes
    'costumes.title': 'Vestuarios',
    'costumes.description': 'Gestione los vestuarios disponibles',
    'costumes.new': 'Nuevo Vestuario',
    'costumes.edit': 'Editar Vestuario',
    'costumes.code': 'Código del Vestuario',
    'costumes.type': 'Tipo de Vestuario',
    'costumes.size': 'Tamaño',
    'costumes.primaryColor': 'Color Predominante',
    'costumes.secondaryColor': 'Color Secundario',
    'costumes.material': 'Material',
    'costumes.images': 'Imágenes',
    'costumes.mainImage': 'Imagen Principal',
    'costumes.empty': 'No hay vestuarios registrados',
    
    // People
    'people.title': 'Personas',
    'people.description': 'Gestione el registro de personas',
    'people.new': 'Nueva Persona',
    'people.edit': 'Editar Persona',
    'people.firstName': 'Nombre',
    'people.lastName': 'Apellido',
    'people.workName': 'Nombre Artístico',
    'people.phone': 'Teléfono',
    'people.email': 'Correo',
    'people.photo': 'Foto',
    
    // Dashboard
    'dashboard.title': 'Panel',
    'dashboard.welcome': 'Bienvenido',
    'dashboard.overview': 'Resumen',
    
    // Costs
    'costs.title': 'Costos',
    'costs.estimatedCost': 'Costo Estimado',
    'costs.actualCost': 'Costo Real',
    'costs.dailyRate': 'Tarifa Diaria',
    'costs.hourlyRate': 'Tarifa por Hora',
    'costs.totalCost': 'Costo Total',
    
    // Currency
    'currency.symbol': '€',
    'currency.code': 'EUR',
  },
};

// Currency locale mapping
const currencyLocales: Record<Language, { locale: string; currency: string }> = {
  pt: { locale: 'pt-BR', currency: 'BRL' },
  en: { locale: 'en-US', currency: 'USD' },
  es: { locale: 'es-ES', currency: 'EUR' },
};

// Language labels
export const languageLabels: Record<Language, { name: string; flag: string }> = {
  pt: { name: 'Português', flag: '🇧🇷' },
  en: { name: 'English', flag: '🇺🇸' },
  es: { name: 'Español', flag: '🇪🇸' },
};

interface LanguageProviderProps {
  children: ReactNode;
}

export const LanguageProvider = ({ children }: LanguageProviderProps) => {
  const [language, setLanguageState] = useState<Language>(() => {
    const stored = localStorage.getItem('kreato_language');
    return (stored as Language) || 'pt';
  });

  useEffect(() => {
    localStorage.setItem('kreato_language', language);
    document.documentElement.lang = language;
  }, [language]);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
  };

  const t = (key: string): string => {
    return translations[language][key] || key;
  };

  const formatCurrency = (value: number): string => {
    const { locale, currency } = currencyLocales[language];
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
    }).format(value);
  };

  const formatDate = (date: Date | string): string => {
    const { locale } = currencyLocales[language];
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return new Intl.DateTimeFormat(locale).format(dateObj);
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, formatCurrency, formatDate }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
