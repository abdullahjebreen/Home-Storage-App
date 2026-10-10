export type Language = 'en' | 'ar';

export type TranslationKey =
  | 'app.name'
  | 'app.tagline'
  // Auth
  | 'auth.signIn'
  | 'auth.signUp'
  | 'auth.signOut'
  | 'auth.email'
  | 'auth.password'
  | 'auth.confirmPassword'
  | 'auth.displayName'
  | 'auth.householdName'
  | 'auth.createAccount'
  | 'auth.haveAccount'
  | 'auth.noAccount'
  | 'auth.signingIn'
  | 'auth.signingUp'
  | 'auth.invalidCredentials'
  | 'auth.emailExists'
  | 'auth.passwordMismatch'
  | 'auth.welcome'
  | 'auth.language'
  | 'nav.home'
  | 'nav.locations'
  | 'nav.search'
  | 'nav.add'
  | 'nav.station'
  | 'nav.settings'
  // Home
  | 'home.search'
  | 'home.addItem'
  | 'home.scanQR'
  | 'home.browseLocations'
  | 'home.recentlyAdded'
  | 'home.forgottenItems'
  | 'home.lowStock'
  | 'home.expiringSoon'
  | 'home.doWeHaveThis'
  | 'home.totalItems'
  | 'home.totalLocations'
  | 'home.lentOut'
  | 'home.noItemsYet'
  | 'home.addFirstItem'
  // Items
  | 'item.name'
  | 'item.nameAr'
  | 'item.description'
  | 'item.category'
  | 'item.location'
  | 'item.owner'
  | 'item.shared'
  | 'item.quantity'
  | 'item.unit'
  | 'item.tags'
  | 'item.condition'
  | 'item.importance'
  | 'item.status'
  | 'item.purchaseDate'
  | 'item.purchasePrice'
  | 'item.store'
  | 'item.warrantyExpiry'
  | 'item.expiryDate'
  | 'item.lowStockThreshold'
  | 'item.forgottenInterval'
  | 'item.photos'
  | 'item.primaryPhoto'
  | 'item.addPhoto'
  | 'item.save'
  | 'item.cancel'
  | 'item.edit'
  | 'item.delete'
  | 'item.move'
  | 'item.lend'
  | 'item.printQR'
  | 'item.newItem'
  | 'item.editItem'
  | 'item.itemDetails'
  | 'item.atLeastOneName'
  | 'item.namePlaceholder'
  | 'item.descriptionPlaceholder'
  | 'item.saved'
  | 'item.saveFailed'
  | 'item.deleted'
  | 'item.deleteFailed'
  | 'item.confirmDelete'
  | 'item.confirmDeleteValuable'
  // Locations
  | 'location.name'
  | 'location.nameAr'
  | 'location.description'
  | 'location.label'
  | 'location.parent'
  | 'location.property'
  | 'location.topLevel'
  | 'location.addLocation'
  | 'location.editLocation'
  | 'location.noParent'
  | 'location.sublocations'
  | 'location.containedItems'
  | 'location.empty'
  | 'location.breadcrumb'
  | 'location.delete'
  | 'location.cannotDeleteNonEmpty'
  | 'location.saved'
  | 'location.saveFailed'
  | 'location.contextPhoto'
  // Conditions
  | 'condition.New'
  | 'condition.Excellent'
  | 'condition.Good'
  | 'condition.Worn'
  | 'condition.Damaged'
  | 'condition.NeedsRepair'
  // Importance
  | 'importance.Valuable'
  | 'importance.Important'
  | 'importance.Cheap'
  | 'importance.DoubtfulNeed'
  | 'importance.Garbage'
  | 'importance.WaitingforDisposition'
  // Status
  | 'status.in_place'
  | 'status.lent_out'
  | 'status.checked_out'
  | 'status.deleted'
  // Search
  | 'search.placeholder'
  | 'search.noResults'
  | 'search.results'
  | 'search.filters'
  | 'search.all'
  | 'search.cardView'
  | 'search.listView'
  // Common
  | 'common.loading'
  | 'common.error'
  | 'common.retry'
  | 'common.save'
  | 'common.cancel'
  | 'common.delete'
  | 'common.edit'
  | 'common.back'
  | 'common.none'
  | 'common.optional'
  | 'common.search'
  | 'common.confirm'
  | 'common.yes'
  | 'common.no'
  | 'common.unknown'
  | 'common.darkMode'
  | 'common.lightMode'
  | 'common.language'
  // Categories
  | 'category.manage'
  | 'category.add'
  | 'category.name'
  | 'category.nameAr'
  | 'category.delete'
  | 'category.saved'
  | 'settings.title'
  | 'settings.household'
  | 'settings.members'
  | 'settings.language'
  | 'settings.theme'
  | 'settings.account'
  | 'settings.role'
  | 'role.admin'
  | 'role.member'
  | 'auth.completeSetup'
  | 'auth.completeSetupDesc'
  | 'auth.finishSetup';

type Translations = Record<TranslationKey, string>;

const en: Translations = {
  'app.name': 'HomeStore',
  'app.tagline': 'Your family home inventory',
  'auth.signIn': 'Sign In',
  'auth.signUp': 'Sign Up',
  'auth.signOut': 'Sign Out',
  'auth.email': 'Email',
  'auth.password': 'Password',
  'auth.confirmPassword': 'Confirm Password',
  'auth.displayName': 'Your Name',
  'auth.householdName': 'Household Name',
  'auth.createAccount': 'Create Account',
  'auth.haveAccount': 'Already have an account?',
  'auth.noAccount': "Don't have an account?",
  'auth.signingIn': 'Signing in...',
  'auth.signingUp': 'Creating account...',
  'auth.invalidCredentials': 'Invalid email or password',
  'auth.emailExists': 'An account with this email already exists',
  'auth.passwordMismatch': 'Passwords do not match',
  'auth.welcome': 'Welcome',
  'auth.language': 'Language',
  'nav.home': 'Home',
  'nav.locations': 'Locations',
  'nav.search': 'Search',
  'nav.add': 'Add',
  'nav.station': 'Station',
  'nav.settings': 'Settings',
  'home.search': 'Search',
  'home.addItem': 'Add Item',
  'home.scanQR': 'Scan QR',
  'home.browseLocations': 'Browse Locations',
  'home.recentlyAdded': 'Recently Added',
  'home.forgottenItems': 'Forgotten Items',
  'home.lowStock': 'Low Stock',
  'home.expiringSoon': 'Expiring Soon',
  'home.doWeHaveThis': 'Do We Already Have This?',
  'home.totalItems': 'Total Items',
  'home.totalLocations': 'Locations',
  'home.lentOut': 'Lent Out',
  'home.noItemsYet': 'No items yet',
  'home.addFirstItem': 'Add your first item',
  'item.name': 'Name (English)',
  'item.nameAr': 'Name (Arabic)',
  'item.description': 'Description',
  'item.category': 'Category',
  'item.location': 'Location',
  'item.owner': 'Owner',
  'item.shared': 'Shared',
  'item.quantity': 'Quantity',
  'item.unit': 'Unit',
  'item.tags': 'Tags',
  'item.condition': 'Condition',
  'item.importance': 'Importance',
  'item.status': 'Status',
  'item.purchaseDate': 'Purchase Date',
  'item.purchasePrice': 'Purchase Price',
  'item.store': 'Store',
  'item.warrantyExpiry': 'Warranty Expiry',
  'item.expiryDate': 'Expiry Date',
  'item.lowStockThreshold': 'Low Stock Threshold',
  'item.forgottenInterval': 'Forgotten After (months)',
  'item.photos': 'Photos',
  'item.primaryPhoto': 'Primary Photo',
  'item.addPhoto': 'Add Photo',
  'item.save': 'Save Item',
  'item.cancel': 'Cancel',
  'item.edit': 'Edit',
  'item.delete': 'Delete',
  'item.move': 'Move',
  'item.lend': 'Lend',
  'item.printQR': 'Print QR',
  'item.newItem': 'New Item',
  'item.editItem': 'Edit Item',
  'item.itemDetails': 'Item Details',
  'item.atLeastOneName': 'At least one name (English or Arabic) is required',
  'item.namePlaceholder': 'e.g. Blue umbrella',
  'item.descriptionPlaceholder': 'Optional description',
  'item.saved': 'Item saved',
  'item.saveFailed': 'Failed to save item',
  'item.deleted': 'Item deleted',
  'item.deleteFailed': 'Failed to delete item',
  'item.confirmDelete': 'Are you sure you want to delete this item?',
  'item.confirmDeleteValuable': 'This is a valuable item. Are you sure you want to delete it?',
  'location.name': 'Name',
  'location.nameAr': 'Name (Arabic)',
  'location.description': 'Description',
  'location.label': 'Label / Number',
  'location.parent': 'Parent Location',
  'location.property': 'Property',
  'location.topLevel': 'Top-level (no parent)',
  'location.addLocation': 'Add Location',
  'location.editLocation': 'Edit Location',
  'location.noParent': 'No parent (top level)',
  'location.sublocations': 'Sub-locations',
  'location.containedItems': 'Items here',
  'location.empty': 'This location is empty',
  'location.breadcrumb': 'Path',
  'location.delete': 'Delete Location',
  'location.cannotDeleteNonEmpty': 'Cannot delete a location that contains items or sub-locations',
  'location.saved': 'Location saved',
  'location.saveFailed': 'Failed to save location',
  'location.contextPhoto': 'Context Photo (from ~2m away)',
  'condition.New': 'New',
  'condition.Excellent': 'Excellent',
  'condition.Good': 'Good',
  'condition.Worn': 'Worn',
  'condition.Damaged': 'Damaged',
  'condition.NeedsRepair': 'Needs Repair',
  'importance.Valuable': 'Valuable',
  'importance.Important': 'Important',
  'importance.Cheap': 'Cheap',
  'importance.DoubtfulNeed': 'Doubtful Need',
  'importance.Garbage': 'Garbage',
  'importance.WaitingforDisposition': 'Waiting for Disposition',
  'status.in_place': 'In Place',
  'status.lent_out': 'Lent Out',
  'status.checked_out': 'Checked Out',
  'status.deleted': 'Deleted',
  'search.placeholder': 'Search items by name, description, tags...',
  'search.noResults': 'No items found',
  'search.results': 'Search Results',
  'search.filters': 'Filters',
  'search.all': 'All',
  'search.cardView': 'Card View',
  'search.listView': 'List View',
  'common.loading': 'Loading...',
  'common.error': 'Something went wrong',
  'common.retry': 'Retry',
  'common.save': 'Save',
  'common.cancel': 'Cancel',
  'common.delete': 'Delete',
  'common.edit': 'Edit',
  'common.back': 'Back',
  'common.none': 'None',
  'common.optional': 'optional',
  'common.search': 'Search',
  'common.confirm': 'Confirm',
  'common.yes': 'Yes',
  'common.no': 'No',
  'common.unknown': 'Unknown',
  'common.darkMode': 'Dark Mode',
  'common.lightMode': 'Light Mode',
  'common.language': 'Language',
  'category.manage': 'Manage Categories',
  'category.add': 'Add Category',
  'category.name': 'Category Name',
  'category.nameAr': 'Category Name (Arabic)',
  'category.delete': 'Delete Category',
  'category.saved': 'Category saved',
  'settings.title': 'Settings',
  'settings.household': 'Household',
  'settings.members': 'Members',
  'settings.language': 'Language',
  'settings.theme': 'Theme',
  'settings.account': 'Account',
  'settings.role': 'Role',
  'role.admin': 'Admin',
  'role.member': 'Member',
  'auth.completeSetup': 'Complete Registration',
  'auth.completeSetupDesc': 'Your account was created but your household setup was interrupted. Let\'s finish that now.',
  'auth.finishSetup': 'Finish Setup',
};

const ar: Translations = {
  'app.name': 'مستودع البيت',
  'app.tagline': 'رتب المخزن لعائلتك',
  'auth.signIn': 'تسجيل الدخول',
  'auth.signUp': 'إنشاء حساب',
  'auth.signOut': 'تسجيل الخروج',
  'auth.email': 'البريد الإلكتروني',
  'auth.password': 'كلمة المرور',
  'auth.confirmPassword': 'تأكيد كلمة المرور',
  'auth.displayName': 'اسمك',
  'auth.householdName': 'اسم الأسرة',
  'auth.createAccount': 'إنشاء حساب',
  'auth.haveAccount': 'لديك حساب بالفعل؟',
  'auth.noAccount': 'ليس لديك حساب؟',
  'auth.signingIn': 'جاري تسجيل الدخول...',
  'auth.signingUp': 'جاري إنشاء الحساب...',
  'auth.invalidCredentials': 'بريد إلكتروني أو كلمة مرور غير صحيحة',
  'auth.emailExists': 'يوجد حساب بهذا البريد الإلكتروني بالفعل',
  'auth.passwordMismatch': 'كلمات المرور غير متطابقة',
  'auth.welcome': 'مرحبا',
  'auth.language': 'اللغة',
  'nav.home': 'الرئيسية',
  'nav.locations': 'المواقع',
  'nav.search': 'بحث',
  'nav.add': 'إضافة',
  'nav.station': 'المحطة',
  'nav.settings': 'الإعدادات',
  'home.search': 'بحث',
  'home.addItem': 'إضافة عنصر',
  'home.scanQR': 'مسح QR',
  'home.browseLocations': 'تصفح المواقع',
  'home.recentlyAdded': 'أضيف حديثاً',
  'home.forgottenItems': 'عناصر منسية',
  'home.lowStock': 'مخزون منخفض',
  'home.expiringSoon': 'ينتهي قريباً',
  'home.doWeHaveThis': 'هل لدينا هذا بالفعل؟',
  'home.totalItems': 'إجمالي العناصر',
  'home.totalLocations': 'المواقع',
  'home.lentOut': 'معار',
  'home.noItemsYet': 'لا توجد عناصر بعد',
  'home.addFirstItem': 'أضف أول عنصر',
  'item.name': 'الاسم (إنجليزي)',
  'item.nameAr': 'الاسم (عربي)',
  'item.description': 'الوصف',
  'item.category': 'الفئة',
  'item.location': 'الموقع',
  'item.owner': 'المالك',
  'item.shared': 'مشترك',
  'item.quantity': 'الكمية',
  'item.unit': 'الوحدة',
  'item.tags': 'الوسوم',
  'item.condition': 'الحالة',
  'item.importance': 'الأهمية',
  'item.status': 'الحالة',
  'item.purchaseDate': 'تاريخ الشراء',
  'item.purchasePrice': 'سعر الشراء',
  'item.store': 'المتجر',
  'item.warrantyExpiry': 'انتهاء الضمان',
  'item.expiryDate': 'تاريخ الانتهاء',
  'item.lowStockThreshold': 'حد المخزون المنخفض',
  'item.forgottenInterval': 'النسيان بعد (أشهر)',
  'item.photos': 'الصور',
  'item.primaryPhoto': 'الصورة الرئيسية',
  'item.addPhoto': 'إضافة صورة',
  'item.save': 'حفظ العنصر',
  'item.cancel': 'إلغاء',
  'item.edit': 'تعديل',
  'item.delete': 'حذف',
  'item.move': 'نقل',
  'item.lend': 'إعارة',
  'item.printQR': 'طباعة QR',
  'item.newItem': 'عنصر جديد',
  'item.editItem': 'تعديل العنصر',
  'item.itemDetails': 'تفاصيل العنصر',
  'item.atLeastOneName': 'مطلب اسم واحد على الأقل (إنجليزي أو عربي)',
  'item.namePlaceholder': 'مثال: مظلة زرقاء',
  'item.descriptionPlaceholder': 'وصف اختياري',
  'item.saved': 'تم حفظ العنصر',
  'item.saveFailed': 'فشل حفظ العنصر',
  'item.deleted': 'تم حذف العنصر',
  'item.deleteFailed': 'فشل حذف العنصر',
  'item.confirmDelete': 'هل أنت متأكد من حذف هذا العنصر؟',
  'item.confirmDeleteValuable': 'هذا عنصر قيّم. هل أنت متأكد من حذفه؟',
  'location.name': 'الاسم',
  'location.nameAr': 'الاسم (عربي)',
  'location.description': 'الوصف',
  'location.label': 'التصنيف / الرقم',
  'location.parent': 'الموقع الأصلي',
  'location.property': 'العقار',
  'location.topLevel': 'المستوى الأعلى (بدون أصل)',
  'location.addLocation': 'إضافة موقع',
  'location.editLocation': 'تعديل الموقع',
  'location.noParent': 'بدون أصل (المستوى الأعلى)',
  'location.sublocations': 'المواقع الفرعية',
  'location.containedItems': 'العناصر هنا',
  'location.empty': 'هذا الموقع فارغ',
  'location.breadcrumb': 'المسار',
  'location.delete': 'حذف الموقع',
  'location.cannotDeleteNonEmpty': 'لا يمكن حذف موقع يحتوي على عناصر أو مواقع فرعية',
  'location.saved': 'تم حفظ الموقع',
  'location.saveFailed': 'فشل حفظ الموقع',
  'location.contextPhoto': 'صورة سياقية (من مسافة ~2 متر)',
  'condition.New': 'جديد',
  'condition.Excellent': 'ممتاز',
  'condition.Good': 'جيد',
  'condition.Worn': 'مهترئ',
  'condition.Damaged': 'تالف',
  'condition.NeedsRepair': 'يحتاج إصلاح',
  'importance.Valuable': 'قيّم',
  'importance.Important': 'مهم',
  'importance.Cheap': 'رخيص',
  'importance.DoubtfulNeed': 'حاجة مشكوك فيها',
  'importance.Garbage': 'قمامة',
  'importance.WaitingforDisposition': 'بانتظار التصرف',
  'status.in_place': 'في مكانه',
  'status.lent_out': 'معار',
  'status.checked_out': 'مخرج',
  'status.deleted': 'محذوف',
  'search.placeholder': 'ابحث عن العناصر بالاسم أو الوصف أو الوسوم...',
  'search.noResults': 'لم يتم العثور على عناصر',
  'search.results': 'نتائج البحث',
  'search.filters': 'تصفية',
  'search.all': 'الكل',
  'search.cardView': 'عرض البطاقات',
  'search.listView': 'عرض القائمة',
  'common.loading': 'جاري التحميل...',
  'common.error': 'حدث خطأ ما',
  'common.retry': 'إعادة المحاولة',
  'common.save': 'حفظ',
  'common.cancel': 'إلغاء',
  'common.delete': 'حذف',
  'common.edit': 'تعديل',
  'common.back': 'رجوع',
  'common.none': 'لا شيء',
  'common.optional': 'اختياري',
  'common.search': 'بحث',
  'common.confirm': 'تأكيد',
  'common.yes': 'نعم',
  'common.no': 'لا',
  'common.unknown': 'غير معروف',
  'common.darkMode': 'الوضع الداكن',
  'common.lightMode': 'الوضع الفاتح',
  'common.language': 'اللغة',
  'category.manage': 'إدارة الفئات',
  'category.add': 'إضافة فئة',
  'category.name': 'اسم الفئة',
  'category.nameAr': 'اسم الفئة (عربي)',
  'category.delete': 'حذف الفئة',
  'category.saved': 'تم حفظ الفئة',
  'settings.title': 'الإعدادات',
  'settings.household': 'الأسرة',
  'settings.members': 'الأعضاء',
  'settings.language': 'اللغة',
  'settings.theme': 'المظهر',
  'settings.account': 'الحساب',
  'settings.role': 'الدور',
  'role.admin': 'مدير',
  'role.member': 'عضو',
  'auth.completeSetup': 'إكمال التسجيل',
  'auth.completeSetupDesc': 'تم إنشاء حسابك ولكن لم يكتمل إعداد منزلك. دعنا ننهي ذلك الآن.',
  'auth.finishSetup': 'إنهاء الإعداد',
};

const translations: Record<Language, Translations> = { en, ar };

export function translate(key: TranslationKey, lang: Language): string {
  return translations[lang][key] || translations.en[key] || key;
}

export function getCategoryName(
  cat: { name: string; name_ar: string | null } | null | undefined,
  lang: Language
): string {
  if (!cat) return translate('common.none', lang);
  if (lang === 'ar' && cat.name_ar) return cat.name_ar;
  return cat.name;
}

export function getLocationName(
  loc: { name: string; name_ar: string | null } | null | undefined,
  lang: Language
): string {
  if (!loc) return translate('common.unknown', lang);
  if (lang === 'ar' && loc.name_ar) return loc.name_ar;
  return loc.name;
}

export function getDisplayName(
  name: string | null,
  nameAr: string | null,
  lang: Language
): string {
  if (lang === 'ar' && nameAr) return nameAr;
  return name || nameAr || '';
}
