'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  Receipt, 
  Plus, 
  ArrowLeft, 
  Loader2, 
  AlertCircle, 
  CheckCircle2, 
  Clock, 
  Upload,
  Calendar,
  X,
  FileText,
  DollarSign,
  Plane,
  Wallet,
  ChevronRight,
  Globe,
  Building2,
  MapPin,
  Car,
  Bus,
  Train,
  Trash2,
  ArrowUpDown,
  ChevronDown
} from 'lucide-react';
import { UserSession } from '../services/api';
import ApiService, { ExpenseRecord, ExpenseCategory, ExpenseProject, ExpenseClaimRecord, TripRecord, AdvanceRecord } from '../services/api';

export interface ItineraryFlightItem {
  id: string;
  type: 'flight';
  trip_type: 'one_way' | 'round_trip';
  depart_from: string;
  arrive_at: string;
  departure_date: string;
  time_preference: string;
  flight_class: string;
  description: string;
}

export interface ItineraryHotelItem {
  id: string;
  type: 'hotel';
  city: string;
  hotel_name: string;
  check_in_date: string;
  check_out_date: string;
  room_type: string;
  description: string;
}

export interface ItineraryCarRentalItem {
  id: string;
  type: 'car';
  pickup_location: string;
  dropoff_location: string;
  pickup_date: string;
  dropoff_date: string;
  pickup_time: string;
  dropoff_time: string;
  car_type: string;
  driver_required: boolean;
  description: string;
}

export interface ItineraryBusItem {
  id: string;
  type: 'bus';
  depart_from: string;
  arrive_at: string;
  departure_date: string;
  time_preference: string;
  bus_type: string;
  description: string;
}

export interface ItineraryTrainItem {
  id: string;
  type: 'train';
  depart_from: string;
  arrive_at: string;
  departure_date: string;
  time_preference: string;
  train_class: string;
  train_name_number: string;
  description: string;
}

export type ItineraryItem = 
  | ItineraryFlightItem 
  | ItineraryHotelItem 
  | ItineraryCarRentalItem 
  | ItineraryBusItem 
  | ItineraryTrainItem;

interface ExpensesViewProps {
  session: UserSession;
  onBackToDashboard?: () => void;
}

export default function ExpensesView({ session, onBackToDashboard }: ExpensesViewProps) {
  const [activeSubmodule, setActiveSubmodule] = useState<'launcher' | 'expenses' | 'claims' | 'trips' | 'advances'>('launcher');
  const [hasLoadedExpenses, setHasLoadedExpenses] = useState(false);
  const [expenses, setExpenses] = useState<ExpenseRecord[]>([]);
  const [categories, setCategories] = useState<ExpenseCategory[]>([]);
  const [projects, setProjects] = useState<ExpenseProject[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showApplyForm, setShowApplyForm] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Advances State
  const [advances, setAdvances] = useState<AdvanceRecord[]>([]);
  const [hasLoadedAdvances, setHasLoadedAdvances] = useState(false);
  const [isAdvancesLoading, setIsAdvancesLoading] = useState(false);
  const [showAdvanceForm, setShowAdvanceForm] = useState(false);
  const [isSubmittingAdvance, setIsSubmittingAdvance] = useState(false);
  const [advanceFilterStatus, setAdvanceFilterStatus] = useState<'all' | 'pending' | 'approved' | 'paid'>('all');

  // New Advance Form State
  const [advanceAmount, setAdvanceAmount] = useState('');
  const [advanceCurrency, setAdvanceCurrency] = useState('INR');
  const [advanceRequestDate, setAdvanceRequestDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [selectedAdvanceTripId, setSelectedAdvanceTripId] = useState('');
  const [advanceNotes, setAdvanceNotes] = useState('');

  // Trips State
  const [trips, setTrips] = useState<TripRecord[]>([]);
  const [hasLoadedTrips, setHasLoadedTrips] = useState(false);
  const [isTripsLoading, setIsTripsLoading] = useState(false);
  const [showTripForm, setShowTripForm] = useState(false);
  const [isSubmittingTrip, setIsSubmittingTrip] = useState(false);

  // New Trip Form State
  const [tripName, setTripName] = useState('');
  const [travelType, setTravelType] = useState<'domestic' | 'international'>('domestic');
  const [destinationCountry, setDestinationCountry] = useState('');
  const [isVisaRequired, setIsVisaRequired] = useState(false);
  const [tripBudget, setTripBudget] = useState('');
  const [tripPurpose, setTripPurpose] = useState('');
  const [selectedTripProjectId, setSelectedTripProjectId] = useState('');
  const [seatPreference, setSeatPreference] = useState('');
  const [mealPreference, setMealPreference] = useState('');

  // Trip Itinerary State
  const [isItineraryEnabled, setIsItineraryEnabled] = useState(false);
  const [itineraryItems, setItineraryItems] = useState<ItineraryItem[]>([]);

  // Claims State
  const [claims, setClaims] = useState<ExpenseClaimRecord[]>([]);
  const [hasLoadedClaims, setHasLoadedClaims] = useState(false);
  const [isClaimsLoading, setIsClaimsLoading] = useState(false);
  const [showClaimForm, setShowClaimForm] = useState(false);
  const [isSubmittingClaim, setIsSubmittingClaim] = useState(false);
  const [draftExpensesForClaim, setDraftExpensesForClaim] = useState<ExpenseRecord[]>([]);
  const [isLoadingDraftExpenses, setIsLoadingDraftExpenses] = useState(false);

  // New Claim Form State
  const [claimTitle, setClaimTitle] = useState('');
  const [claimCurrency, setClaimCurrency] = useState('INR');
  const [claimDescription, setClaimDescription] = useState('');
  const [claimAdvanceAmount, setClaimAdvanceAmount] = useState('');
  const [claimAdvanceNotes, setClaimAdvanceNotes] = useState('');
  const [selectedExpenseIdsForClaim, setSelectedExpenseIdsForClaim] = useState<number[]>([]);

  // Form State
  const [itemName, setItemName] = useState('');
  const [currency, setCurrency] = useState('INR');
  const [price, setPrice] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('');
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [purchaseDate, setPurchaseDate] = useState('');
  const [purchasedFrom, setPurchasedFrom] = useState('');
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [customFields, setCustomFields] = useState<any[]>([]);
  const [customFieldsValues, setCustomFieldsValues] = useState<Record<string, any>>({});

  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadData = async (silent = false) => {
    if (!silent) setIsLoading(true);
    setErrorMsg(null);
    try {
      try {
        const companyData = await ApiService.getCompany(session.baseUrl, session.token);
        if (companyData && companyData.mobile_expense_status !== undefined) {
          const isExpenseEnabled = companyData.mobile_expense_status !== false && companyData.mobile_expense_status !== 0 && companyData.mobile_expense_status !== '0';
          session.mobileExpenseEnabled = isExpenseEnabled;
          if (!isExpenseEnabled && onBackToDashboard) {
            onBackToDashboard();
            return;
          }
        }
      } catch (e) {
        console.warn('Failed to refresh company expense status:', e);
      }

      // Fetch currencies (gracefully ignore errors)
      try {
        await ApiService.fetchCurrencies(session.baseUrl, session.token);
      } catch (e) {
        console.warn('Failed to fetch currencies metadata:', e);
      }

      let expensesList: ExpenseRecord[] = [];
      try {
        expensesList = await ApiService.getExpenses(session.baseUrl, session.token, session.userId);
      } catch (e: any) {
        console.error('Failed to load expenses list:', e);
        setErrorMsg(e.message || 'Failed to load expenses history');
      }

      let categoriesList: ExpenseCategory[] = [];
      try {
        categoriesList = await ApiService.getExpenseCategories(session.baseUrl, session.token);
      } catch (e) {
        console.warn('Failed to load expense categories (unsupported backend endpoint):', e);
      }

      let projectsList: ExpenseProject[] = [];
      try {
        projectsList = await ApiService.getExpenseProjects(session.baseUrl, session.token);
      } catch (e) {
        console.warn('Failed to load expense projects:', e);
      }

      let customFieldsList: any[] = [];
      try {
        customFieldsList = await ApiService.getExpenseCustomFields(session.baseUrl, session.token);
        console.log('Expense custom fields fetched:', customFieldsList);
      } catch (e) {
        console.warn('Failed to load expense custom fields:', e);
      }
      
      console.log('Expense categories fetched:', categoriesList);
      console.log('Expense projects fetched:', projectsList);

      // Learn currencies metadata from history records if missing, matching Flutter logic
      if (Array.isArray(expensesList)) {
        for (const exp of expensesList) {
          const curr = exp.currency;
          if (curr) {
            const code = curr.currency_code?.toString().toUpperCase();
            const id = curr.id;
            const rate = parseFloat(curr.exchange_rate?.toString() || '1.0') || 1.0;
            if (code && id) {
              ApiService.updateCurrencyMetadata(code, id, rate);
            }
          }
        }
      }

      setExpenses(expensesList);
      setCategories(categoriesList);
      setProjects(projectsList);
      setCustomFields(customFieldsList);
      
      localStorage.setItem('ph_cache_expenses', JSON.stringify(expensesList));
      localStorage.setItem('ph_cache_expense_categories', JSON.stringify(categoriesList));
      localStorage.setItem('ph_cache_expense_projects', JSON.stringify(projectsList));
      localStorage.setItem('ph_cache_expense_custom_fields', JSON.stringify(customFieldsList));

      if (categoriesList.length > 0) {
        setSelectedCategoryId(categoriesList[0].id.toString());
      }
      setHasLoadedExpenses(true);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Failed to fetch expenses claims data');
    } finally {
      setIsLoading(false);
    }
  };

  const loadClaimsData = async (silent = false) => {
    if (!silent) setIsClaimsLoading(true);
    setErrorMsg(null);
    try {
      const claimsList = await ApiService.getExpenseClaims(session.baseUrl, session.token);
      setClaims(claimsList);
      localStorage.setItem('ph_cache_expense_claims', JSON.stringify(claimsList));
      setHasLoadedClaims(true);
    } catch (err: any) {
      console.error('Failed to load expense claims:', err);
      setErrorMsg(err.message || 'Failed to load expense claims');
    } finally {
      setIsClaimsLoading(false);
    }
  };

  const loadDraftExpensesForClaim = async () => {
    setIsLoadingDraftExpenses(true);
    try {
      const drafts = await ApiService.getDraftExpensesForClaim(session.baseUrl, session.token);
      setDraftExpensesForClaim(drafts);
      setSelectedExpenseIdsForClaim(drafts.map((d) => d.id));
    } catch (err: any) {
      console.warn('Failed to load draft expenses for claim:', err);
    } finally {
      setIsLoadingDraftExpenses(false);
    }
  };

  const loadTripsData = async (silent = false) => {
    if (!silent) setIsTripsLoading(true);
    setErrorMsg(null);
    try {
      const tripsList = await ApiService.getTrips(session.baseUrl, session.token);
      setTrips(tripsList);
      localStorage.setItem('ph_cache_trips', JSON.stringify(tripsList));
      setHasLoadedTrips(true);
    } catch (err: any) {
      console.error('Failed to load trips:', err);
      setErrorMsg(err.message || 'Failed to load trips');
    } finally {
      setIsTripsLoading(false);
    }
  };

  const loadAdvancesData = async (silent = false) => {
    if (!silent) setIsAdvancesLoading(true);
    setErrorMsg(null);
    try {
      const advancesList = await ApiService.getAdvances(session.baseUrl, session.token);
      setAdvances(advancesList);
      localStorage.setItem('ph_cache_advances', JSON.stringify(advancesList));
      setHasLoadedAdvances(true);
    } catch (err: any) {
      console.error('Failed to load advances:', err);
      setErrorMsg(err.message || 'Failed to load advances');
    } finally {
      setIsAdvancesLoading(false);
    }
  };

  useEffect(() => {
    const cachedExpenses = localStorage.getItem('ph_cache_expenses');
    const cachedCategories = localStorage.getItem('ph_cache_expense_categories');
    const cachedProjects = localStorage.getItem('ph_cache_expense_projects');
    const cachedCustomFields = localStorage.getItem('ph_cache_expense_custom_fields');
    if (cachedExpenses && cachedCategories) {
      try {
        const expensesData = JSON.parse(cachedExpenses);
        const categoriesData = JSON.parse(cachedCategories);
        setExpenses(expensesData);
        setCategories(categoriesData);
        if (cachedProjects) {
          setProjects(JSON.parse(cachedProjects));
        }
        if (cachedCustomFields) {
          setCustomFields(JSON.parse(cachedCustomFields));
        }
        if (categoriesData.length > 0) {
          setSelectedCategoryId(categoriesData[0].id.toString());
        }
        setHasLoadedExpenses(true);
      } catch (e) {
        console.error('Failed to parse cached expenses', e);
      }
    }

    const cachedClaims = localStorage.getItem('ph_cache_expense_claims');
    if (cachedClaims) {
      try {
        setClaims(JSON.parse(cachedClaims));
        setHasLoadedClaims(true);
      } catch (e) {
        console.error('Failed to parse cached claims', e);
      }
    }

    const cachedTrips = localStorage.getItem('ph_cache_trips');
    if (cachedTrips) {
      try {
        setTrips(JSON.parse(cachedTrips));
        setHasLoadedTrips(true);
      } catch (e) {
        console.error('Failed to parse cached trips', e);
      }
    }

    const cachedAdvances = localStorage.getItem('ph_cache_advances');
    if (cachedAdvances) {
      try {
        setAdvances(JSON.parse(cachedAdvances));
        setHasLoadedAdvances(true);
      } catch (e) {
        console.error('Failed to parse cached advances', e);
      }
    }
  }, [session]);

  const isBillMandatory = categories.some((c) => c.is_bill_mandatory === true);
  const isProjectMandatory = categories.some((c) => c.is_project_mandatory === true);

  const handleApplySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    // Form validations
    if (!itemName.trim() || !price || !purchaseDate) {
      setErrorMsg('Please fill in all required fields');
      return;
    }

    if (isProjectMandatory && !selectedProjectId) {
      setErrorMsg('Please select a project');
      return;
    }

    if (isBillMandatory && !receiptFile) {
      setErrorMsg('Please attach a receipt');
      return;
    }

    const priceNum = parseFloat(price);
    if (isNaN(priceNum) || priceNum <= 0) {
      setErrorMsg('Please enter a valid expense amount');
      return;
    }

    // Custom Fields validation
    for (const field of customFields) {
      const fieldKey = `field_${field.id}`;
      const isRequired = field.required === 'yes';
      if (isRequired) {
        const val = customFieldsValues[fieldKey];
        if (!val || (Array.isArray(val) && val.length === 0)) {
          setErrorMsg(`Please fill in the required field: ${field.label}`);
          return;
        }
      }
    }

    setIsSubmitting(true);

    try {
      await ApiService.createExpense(
        session.baseUrl,
        session.token,
        session.userId,
        itemName,
        priceNum,
        purchaseDate,
        purchasedFrom,
        selectedCategoryId || null,
        currency,
        receiptFile,
        customFieldsValues,
        selectedProjectId || null
      );

      // Reset form
      setItemName('');
      setPrice('');
      setSelectedProjectId('');
      setPurchasedFrom('');
      setReceiptFile(null);
      setCustomFieldsValues({});
      if (fileInputRef.current) fileInputRef.current.value = '';
      setSuccessMsg('Expense claim submitted successfully');
      setShowApplyForm(false);
      
      // Reload
      await loadData();
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Failed to submit expense claim');
    } finally {
      setIsSubmitting(false);
    }
  };

  const isHeicFile = (file: File): boolean => {
    const type = file.type.toLowerCase();
    const name = file.name.toLowerCase();
    return type === 'image/heic' || type === 'image/heif' || name.endsWith('.heic') || name.endsWith('.heif');
  };

  const compressImageIfNeeded = async (file: File): Promise<File> => {
    if (!file) return file;
    const isHeic = isHeicFile(file);
    if (!isHeic && !file.type.startsWith('image/')) return file;
    // HEIC/HEIF must always be converted to JPEG (unviewable in most browsers used by approvers),
    // even when small enough to skip the usual size-based compression.
    if (!isHeic && file.size <= 1.5 * 1024 * 1024) return file;

    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          const maxDim = 1600;

          if (width > maxDim || height > maxDim) {
            if (width > height) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            } else {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (!ctx) return resolve(file);

          ctx.drawImage(img, 0, 0, width, height);
          canvas.toBlob(
            (blob) => {
              if (blob) {
                const compressedFile = new File([blob], file.name.replace(/\.[^/.]+$/, '.jpg'), {
                  type: 'image/jpeg',
                  lastModified: Date.now(),
                });
                resolve(compressedFile);
              } else {
                resolve(file);
              }
            },
            'image/jpeg',
            0.8
          );
        };
        img.onerror = () => resolve(file);
        img.src = e.target?.result as string;
      };
      reader.onerror = () => resolve(file);
      reader.readAsDataURL(file);
    });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const processed = await compressImageIfNeeded(files[0]);
      setReceiptFile(processed);
    }
  };

  const getStatusColor = (status: string) => {
    const cleanStatus = status.toLowerCase().trim();
    if (cleanStatus === 'approved') return 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400 border-emerald-100 dark:border-emerald-900/40';
    if (cleanStatus === 'rejected') return 'bg-rose-50 text-rose-700 dark:bg-rose-950/20 dark:text-rose-400 border-rose-100 dark:border-rose-900/40';
    return 'bg-amber-50 text-amber-700 dark:bg-amber-950/20 dark:text-amber-400 border-amber-100 dark:border-amber-900/40';
  };

  const formatDate = (dateStr: string) => {
    try {
      const dt = new Date(dateStr);
      if (isNaN(dt.getTime())) return dateStr;
      return dt.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
    } catch {
      return dateStr;
    }
  };

  const ensureISODate = (val: string): string => {
    if (!val) return '';
    if (/^\d{4}-\d{2}-\d{2}$/.test(val)) return val;
    const parsed = new Date(val);
    if (!isNaN(parsed.getTime())) {
      const yyyy = parsed.getFullYear();
      const mm = String(parsed.getMonth() + 1).padStart(2, '0');
      const dd = String(parsed.getDate()).padStart(2, '0');
      return `${yyyy}-${mm}-${dd}`;
    }
    return val;
  };


  const getCurrencySymbol = (exp: ExpenseRecord) => {
    // If currency id is present, query metadata
    if (exp.currency?.id) {
      const sym = ApiService.getCurrencySymbolById(exp.currency.id);
      if (sym) return sym;
    }
    
    // Fallbacks based on code
    const code = exp.currency?.currency_code || 'INR';
    if (code.toUpperCase() === 'USD') return '$';
    if (code.toUpperCase() === 'EUR') return '€';
    return '₹';
  };

  const getCurrencyLabel = (code: string) => {
    if (code === 'USD') return '$ USD';
    if (code === 'EUR') return '€ EUR';
    return '₹ INR';
  };

  // Sync sub-form and submodule with browser/hardware back button
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleSubPopState = () => {
      if (showAdvanceForm) {
        setShowAdvanceForm(false);
      } else if (showTripForm) {
        setShowTripForm(false);
      } else if (showClaimForm) {
        setShowClaimForm(false);
      } else if (showApplyForm) {
        setShowApplyForm(false);
      } else if (activeSubmodule === 'trips' || activeSubmodule === 'claims' || activeSubmodule === 'advances' || activeSubmodule === 'expenses') {
        setActiveSubmodule('launcher');
      }
    };

    window.addEventListener('popstate', handleSubPopState);
    return () => window.removeEventListener('popstate', handleSubPopState);
  }, [showAdvanceForm, showTripForm, showClaimForm, showApplyForm, activeSubmodule]);

  const handleOpenTrips = () => {
    setActiveSubmodule('trips');
    if (!hasLoadedTrips) {
      loadTripsData(false);
    } else {
      loadTripsData(true);
    }
    if (projects.length === 0) {
      ApiService.getExpenseProjects(session.baseUrl, session.token).then((p) => {
        if (p && p.length > 0) {
          setProjects(p);
          localStorage.setItem('ph_cache_expense_projects', JSON.stringify(p));
        }
      }).catch((err) => console.warn('Failed to load projects for trips:', err));
    }
    if (typeof window !== 'undefined') {
      window.history.pushState({ tab: 'expenses', submodule: 'trips' }, '', '#trips-list');
    }
  };

  const handleBackFromTrips = () => {
    if (showTripForm) {
      if (typeof window !== 'undefined' && window.history.state?.form) {
        window.history.back();
      } else {
        setShowTripForm(false);
      }
    } else {
      if (typeof window !== 'undefined' && window.history.state?.submodule) {
        window.history.back();
      } else {
        setActiveSubmodule('launcher');
      }
    }
  };

  const handleOpenNewTrip = () => {
    setShowTripForm(true);
    if (projects.length === 0) {
      ApiService.getExpenseProjects(session.baseUrl, session.token).then((p) => {
        if (p && p.length > 0) {
          setProjects(p);
          localStorage.setItem('ph_cache_expense_projects', JSON.stringify(p));
        }
      }).catch((err) => console.warn('Failed to load projects for trips:', err));
    }
    if (typeof window !== 'undefined') {
      window.history.pushState({ tab: 'expenses', submodule: 'trips', form: 'add' }, '', '#add-trip');
    }
  };

  const addFlightToItinerary = () => {
    setIsItineraryEnabled(true);
    const newItem: ItineraryFlightItem = {
      id: 'flight_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
      type: 'flight',
      trip_type: 'one_way',
      depart_from: '',
      arrive_at: '',
      departure_date: new Date().toISOString().split('T')[0],
      time_preference: 'Any time',
      flight_class: 'Economy',
      description: '',
    };
    setItineraryItems((prev) => [...prev, newItem]);
  };

  const addHotelToItinerary = () => {
    setIsItineraryEnabled(true);
    const today = new Date();
    const dayAfter = new Date(Date.now() + 86400000 * 2);
    const newItem: ItineraryHotelItem = {
      id: 'hotel_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
      type: 'hotel',
      city: '',
      hotel_name: '',
      check_in_date: today.toISOString().split('T')[0],
      check_out_date: dayAfter.toISOString().split('T')[0],
      room_type: 'Single Standard',
      description: '',
    };
    setItineraryItems((prev) => [...prev, newItem]);
  };

  const addCarRentalToItinerary = () => {
    setIsItineraryEnabled(true);
    const today = new Date();
    const tomorrow = new Date(Date.now() + 86400000);
    const newItem: ItineraryCarRentalItem = {
      id: 'car_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
      type: 'car',
      pickup_location: '',
      dropoff_location: '',
      pickup_date: today.toISOString().split('T')[0],
      dropoff_date: tomorrow.toISOString().split('T')[0],
      pickup_time: '',
      dropoff_time: '',
      car_type: 'Sedan',
      driver_required: false,
      description: '',
    };
    setItineraryItems((prev) => [...prev, newItem]);
  };

  const addBusToItinerary = () => {
    setIsItineraryEnabled(true);
    const newItem: ItineraryBusItem = {
      id: 'bus_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
      type: 'bus',
      depart_from: '',
      arrive_at: '',
      departure_date: new Date().toISOString().split('T')[0],
      time_preference: 'Any time',
      bus_type: 'AC Sleeper',
      description: '',
    };
    setItineraryItems((prev) => [...prev, newItem]);
  };

  const addTrainToItinerary = () => {
    setIsItineraryEnabled(true);
    const newItem: ItineraryTrainItem = {
      id: 'train_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
      type: 'train',
      depart_from: '',
      arrive_at: '',
      departure_date: new Date().toISOString().split('T')[0],
      time_preference: 'Any time',
      train_class: '3A',
      train_name_number: '',
      description: '',
    };
    setItineraryItems((prev) => [...prev, newItem]);
  };

  const removeItineraryItem = (id: string) => {
    setItineraryItems((prev) => prev.filter((item) => item.id !== id));
  };

  const updateItineraryItem = (id: string, updates: Partial<ItineraryItem>) => {
    setItineraryItems((prev) =>
      prev.map((item) => (item.id === id ? ({ ...item, ...updates } as ItineraryItem) : item))
    );
  };

  const handleTripSubmit = async (e: React.FormEvent, tripAction: 'draft' | 'submit') => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!tripName.trim()) {
      setErrorMsg('Please enter a trip name');
      return;
    }

    if (travelType === 'international' && !destinationCountry.trim()) {
      setErrorMsg('Please enter destination country for international travel');
      return;
    }

    const budgetNum = tripBudget ? parseFloat(tripBudget) : null;
    if (budgetNum !== null && (isNaN(budgetNum) || budgetNum < 0)) {
      setErrorMsg('Please enter a valid budget amount');
      return;
    }

    setIsSubmittingTrip(true);

    try {
      const flightsPayload = itineraryItems
        .filter((item): item is ItineraryFlightItem => item.type === 'flight')
        .map((f) => ({
          trip_type: f.trip_type,
          depart_from: f.depart_from.trim(),
          arrive_at: f.arrive_at.trim(),
          departure_date: f.departure_date,
          time_preference: f.time_preference,
          flight_class: f.flight_class,
          description: f.description.trim() || undefined,
        }));

      const hotelsPayload = itineraryItems
        .filter((item): item is ItineraryHotelItem => item.type === 'hotel')
        .map((h) => ({
          city: h.city.trim(),
          hotel_name: h.hotel_name.trim() || undefined,
          check_in_date: h.check_in_date,
          check_out_date: h.check_out_date,
          room_type: h.room_type,
          description: h.description.trim() || undefined,
        }));

      const carRentalsPayload = itineraryItems
        .filter((item): item is ItineraryCarRentalItem => item.type === 'car')
        .map((c) => ({
          pickup_location: c.pickup_location.trim(),
          dropoff_location: c.dropoff_location.trim() || undefined,
          pickup_date: c.pickup_date,
          dropoff_date: c.dropoff_date,
          pickup_time: c.pickup_time || undefined,
          dropoff_time: c.dropoff_time || undefined,
          car_type: c.car_type,
          driver_required: c.driver_required,
          description: c.description.trim() || undefined,
        }));

      const busesPayload = itineraryItems
        .filter((item): item is ItineraryBusItem => item.type === 'bus')
        .map((b) => ({
          depart_from: b.depart_from.trim(),
          arrive_at: b.arrive_at.trim(),
          departure_date: b.departure_date,
          time_preference: b.time_preference,
          bus_type: b.bus_type,
          description: b.description.trim() || undefined,
        }));

      const trainsPayload = itineraryItems
        .filter((item): item is ItineraryTrainItem => item.type === 'train')
        .map((t) => ({
          depart_from: t.depart_from.trim(),
          arrive_at: t.arrive_at.trim(),
          departure_date: t.departure_date,
          time_preference: t.time_preference,
          train_class: t.train_class,
          train_name_number: t.train_name_number.trim() || undefined,
          description: t.description.trim() || undefined,
        }));

      const payload: any = {
        trip_name: tripName.trim(),
        travel_type: travelType,
        destination_country: travelType === 'international' ? destinationCountry.trim() : null,
        is_visa_required: travelType === 'international' ? isVisaRequired : false,
        business_purpose: tripPurpose.trim() || null,
        budget_amount: budgetNum,
        project_id: selectedTripProjectId ? parseInt(selectedTripProjectId) : null,
        seat_preference: seatPreference || null,
        meal_preference: mealPreference || null,
        trip_action: tripAction,
        flights: isItineraryEnabled ? flightsPayload : [],
        hotels: isItineraryEnabled ? hotelsPayload : [],
        car_rentals: isItineraryEnabled ? carRentalsPayload : [],
        buses: isItineraryEnabled ? busesPayload : [],
        trains: isItineraryEnabled ? trainsPayload : [],
      };

      await ApiService.createTrip(session.baseUrl, session.token, payload);

      setTripName('');
      setTravelType('domestic');
      setDestinationCountry('');
      setIsVisaRequired(false);
      setTripBudget('');
      setTripPurpose('');
      setSelectedTripProjectId('');
      setSeatPreference('');
      setMealPreference('');
      setIsItineraryEnabled(false);
      setItineraryItems([]);

      setSuccessMsg(tripAction === 'submit' ? 'Trip request submitted for approval' : 'Trip saved as draft');
      setShowTripForm(false);

      await loadTripsData();
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Failed to submit trip request');
    } finally {
      setIsSubmittingTrip(false);
    }
  };

  const getTripStatusColor = (status: string) => {
    const cleanStatus = (status || '').toLowerCase().trim();
    if (cleanStatus === 'approved') return 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400 border-emerald-100 dark:border-emerald-900/40';
    if (cleanStatus === 'rejected') return 'bg-rose-50 text-rose-700 dark:bg-rose-950/20 dark:text-rose-400 border-rose-100 dark:border-rose-900/40';
    if (cleanStatus === 'draft') return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700';
    return 'bg-amber-50 text-amber-700 dark:bg-amber-950/20 dark:text-amber-400 border-amber-100 dark:border-amber-900/40';
  };

  const getDestinationCountryName = (trip: TripRecord): string => {
    if (!trip) return '';
    if (typeof (trip as any).destination_country_name === 'string' && (trip as any).destination_country_name) {
      return (trip as any).destination_country_name;
    }
    const dc = trip.destination_country || (trip as any).destinationCountry;
    if (!dc) return '';
    if (typeof dc === 'string') return dc;
    if (typeof dc === 'object' && dc !== null) {
      return dc.nicename || dc.name || dc.iso || '';
    }
    return '';
  };

  const handleOpenExpenses = () => {
    setActiveSubmodule('expenses');
    if (!hasLoadedExpenses) {
      loadData(false);
    } else {
      loadData(true);
    }
    if (typeof window !== 'undefined') {
      window.history.pushState({ tab: 'expenses', submodule: 'expenses' }, '', '#expenses-list');
    }
  };

  const handleBackFromExpenses = () => {
    if (showApplyForm) {
      if (typeof window !== 'undefined' && window.history.state?.form) {
        window.history.back();
      } else {
        setShowApplyForm(false);
      }
    } else {
      if (typeof window !== 'undefined' && window.history.state?.submodule) {
        window.history.back();
      } else {
        setActiveSubmodule('launcher');
      }
    }
  };

  const handleOpenApply = () => {
    setShowApplyForm(true);
    if (typeof window !== 'undefined') {
      window.history.pushState({ tab: 'expenses', submodule: 'expenses', form: 'add' }, '', '#add-expense');
    }
  };

  const handleOpenClaims = () => {
    setActiveSubmodule('claims');
    if (!hasLoadedClaims) {
      loadClaimsData(false);
    } else {
      loadClaimsData(true);
    }
    if (typeof window !== 'undefined') {
      window.history.pushState({ tab: 'expenses', submodule: 'claims' }, '', '#expense-claims');
    }
  };

  const handleBackFromClaims = () => {
    if (showClaimForm) {
      if (typeof window !== 'undefined' && window.history.state?.form) {
        window.history.back();
      } else {
        setShowClaimForm(false);
      }
    } else {
      if (typeof window !== 'undefined' && window.history.state?.submodule) {
        window.history.back();
      } else {
        setActiveSubmodule('launcher');
      }
    }
  };

  const handleOpenNewClaim = () => {
    setShowClaimForm(true);
    loadDraftExpensesForClaim();
    if (typeof window !== 'undefined') {
      window.history.pushState({ tab: 'expenses', submodule: 'claims', form: 'add' }, '', '#add-claim');
    }
  };

  const handleClaimSubmit = async (e: React.FormEvent, claimAction: 'draft' | 'submit') => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!claimTitle.trim()) {
      setErrorMsg('Please enter a claim title');
      return;
    }

    const advanceNum = parseFloat(claimAdvanceAmount) || 0;
    if (advanceNum < 0) {
      setErrorMsg('Advance amount cannot be negative');
      return;
    }

    setIsSubmittingClaim(true);

    try {
      const currencyId = ApiService.getCurrencyIdByCode(claimCurrency);

      await ApiService.createExpenseClaim(session.baseUrl, session.token, {
        title: claimTitle.trim(),
        currency_id: currencyId,
        description: claimDescription.trim() || undefined,
        advance_amount_applied: advanceNum,
        advance_notes: claimAdvanceNotes.trim() || undefined,
        expense_ids: selectedExpenseIdsForClaim,
        claim_action: claimAction,
      });

      setClaimTitle('');
      setClaimDescription('');
      setClaimAdvanceAmount('');
      setClaimAdvanceNotes('');
      setSelectedExpenseIdsForClaim([]);
      setSuccessMsg(claimAction === 'submit' ? 'Expense claim submitted successfully' : 'Expense claim saved as draft');
      setShowClaimForm(false);

      await loadClaimsData();
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Failed to submit expense claim');
    } finally {
      setIsSubmittingClaim(false);
    }
  };

  const getClaimCurrencySymbol = (claim: ExpenseClaimRecord) => {
    if (claim.currency?.id) {
      const sym = ApiService.getCurrencySymbolById(claim.currency.id);
      if (sym) return sym;
    }
    if (claim.currency?.currency_symbol) {
      return claim.currency.currency_symbol;
    }
    const code = claim.currency?.currency_code || 'INR';
    if (code.toUpperCase() === 'USD') return '$';
    if (code.toUpperCase() === 'EUR') return '€';
    return '₹';
  };

  const getClaimStatusColor = (status: string) => {
    const cleanStatus = (status || '').toLowerCase().trim();
    if (cleanStatus === 'approved') return 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400 border-emerald-100 dark:border-emerald-900/40';
    if (cleanStatus === 'reimbursed') return 'bg-blue-50 text-blue-700 dark:bg-blue-950/20 dark:text-blue-400 border-blue-100 dark:border-blue-900/40';
    if (cleanStatus === 'rejected') return 'bg-rose-50 text-rose-700 dark:bg-rose-950/20 dark:text-rose-400 border-rose-100 dark:border-rose-900/40';
    if (cleanStatus === 'draft') return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700';
    return 'bg-amber-50 text-amber-700 dark:bg-amber-950/20 dark:text-amber-400 border-amber-100 dark:border-amber-900/40';
  };

  const handleOpenAdvances = () => {
    setActiveSubmodule('advances');
    if (!hasLoadedAdvances) {
      loadAdvancesData(false);
    } else {
      loadAdvancesData(true);
    }
    if (trips.length === 0) {
      loadTripsData(true);
    }
    if (typeof window !== 'undefined') {
      window.history.pushState({ tab: 'expenses', submodule: 'advances' }, '', '#advances-list');
    }
  };

  const handleBackFromAdvances = () => {
    if (showAdvanceForm) {
      if (typeof window !== 'undefined' && window.history.state?.form) {
        window.history.back();
      } else {
        setShowAdvanceForm(false);
      }
    } else {
      if (typeof window !== 'undefined' && window.history.state?.submodule) {
        window.history.back();
      } else {
        setActiveSubmodule('launcher');
      }
    }
  };

  const handleOpenNewAdvance = () => {
    setShowAdvanceForm(true);
    setAdvanceRequestDate(new Date().toISOString().split('T')[0]);
    if (trips.length === 0) {
      loadTripsData(true);
    }
    if (typeof window !== 'undefined') {
      window.history.pushState({ tab: 'expenses', submodule: 'advances', form: 'add' }, '', '#add-advance');
    }
  };

  const handleAdvanceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    const amountNum = parseFloat(advanceAmount);
    if (isNaN(amountNum) || amountNum <= 0) {
      setErrorMsg('Please enter a valid advance amount greater than 0');
      return;
    }

    setIsSubmittingAdvance(true);

    try {
      const currencyId = ApiService.getCurrencyIdByCode(advanceCurrency);
      const tripId = selectedAdvanceTripId ? parseInt(selectedAdvanceTripId) : null;

      await ApiService.createAdvance(session.baseUrl, session.token, {
        amount: amountNum,
        currency_id: currencyId,
        trip_id: tripId,
        notes: advanceNotes.trim() || undefined,
        request_date: advanceRequestDate || undefined,
      });

      setAdvanceAmount('');
      setAdvanceNotes('');
      setSelectedAdvanceTripId('');
      setSuccessMsg('Advance request submitted successfully');
      setShowAdvanceForm(false);

      await loadAdvancesData();
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Failed to submit advance request');
    } finally {
      setIsSubmittingAdvance(false);
    }
  };

  const getAdvanceCurrencySymbol = (adv: AdvanceRecord) => {
    if (adv.currency?.currency_symbol) return adv.currency.currency_symbol;
    if (adv.currency?.id) {
      const sym = ApiService.getCurrencySymbolById(adv.currency.id);
      if (sym) return sym;
    }
    const code = adv.currency?.currency_code || 'INR';
    if (code.toUpperCase() === 'USD') return '$';
    if (code.toUpperCase() === 'EUR') return '€';
    return '₹';
  };

  const getAdvanceStatusColor = (status: string) => {
    const cleanStatus = (status || '').toLowerCase().trim();
    if (cleanStatus === 'approved') return 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400 border-emerald-100 dark:border-emerald-900/40';
    if (cleanStatus === 'paid') return 'bg-blue-50 text-blue-700 dark:bg-blue-950/20 dark:text-blue-400 border-blue-100 dark:border-blue-900/40';
    if (cleanStatus === 'rejected') return 'bg-rose-50 text-rose-700 dark:bg-rose-950/20 dark:text-rose-400 border-rose-100 dark:border-rose-900/40';
    return 'bg-amber-50 text-amber-700 dark:bg-amber-950/20 dark:text-amber-400 border-amber-100 dark:border-amber-900/40';
  };

  // Stats calculation
  const pendingCount = expenses.filter((e) => e.status?.toLowerCase() === 'pending').length;
  const totalClaims = expenses.length;

  const pendingAdvancesCount = advances.filter((a) => (a.status || '').toLowerCase() === 'pending').length;
  const approvedAdvancesCount = advances.filter((a) => (a.status || '').toLowerCase() === 'approved').length;
  const paidAdvancesCount = advances.filter((a) => (a.status || '').toLowerCase() === 'paid').length;
  const totalAdvancesCount = advances.length;
  const totalAdvancesAmount = advances.reduce((sum, a) => sum + (parseFloat(a.amount?.toString() || '0') || 0), 0);

  const filteredAdvances = advances.filter((a) => {
    if (advanceFilterStatus === 'all') return true;
    return (a.status || '').toLowerCase() === advanceFilterStatus;
  });

  const pendingClaimsCount = claims.filter((c) => {
    const s = (c.status || '').toLowerCase();
    return s === 'pending' || s === 'submitted';
  }).length;
  const totalClaimsCount = claims.length;

  const pendingTripsCount = trips.filter((t) => (t.status || '').toLowerCase() === 'pending').length;
  const totalTripsCount = trips.length;

  const selectedDraftExpenses = draftExpensesForClaim.filter((d) => selectedExpenseIdsForClaim.includes(d.id));
  const subtotalSelected = selectedDraftExpenses.reduce((sum, item) => sum + (parseFloat(item.price || '0') || 0), 0);
  const advanceDeduction = parseFloat(claimAdvanceAmount) || 0;
  const netPayable = Math.max(0, subtotalSelected - advanceDeduction);

  return (
    <div className="w-full max-w-3xl mx-auto flex flex-col gap-6 pt-2 md:pt-4 pb-24 md:pb-6 font-sans">
      
      {/* Dynamic Notifications */}
      {successMsg && (
        <div className="fixed top-[calc(env(safe-area-inset-top,0px)+16px)] left-4 right-4 md:left-auto md:right-6 md:max-w-md z-50 flex items-start justify-between gap-3 p-3.5 rounded-2xl shadow-xl border bg-emerald-50 border-emerald-200 text-emerald-800 dark:bg-emerald-950/80 dark:border-emerald-800 dark:text-emerald-200 text-xs md:text-sm font-semibold transition-all duration-300 animate-in fade-in slide-in-from-top-4 backdrop-blur-md">
          <div className="flex items-start gap-2.5 flex-1 min-w-0">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 dark:text-emerald-400 mt-0.5" />
            <span className="leading-snug break-words">{successMsg}</span>
          </div>
          <button 
            type="button"
            onClick={() => setSuccessMsg(null)} 
            className="p-1 -mr-1 -mt-1 rounded-lg text-emerald-600 hover:text-emerald-800 dark:text-emerald-400 dark:hover:text-emerald-200 hover:bg-emerald-100/50 dark:hover:bg-emerald-900/50 transition-colors cursor-pointer shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {errorMsg && (
        <div className="fixed top-[calc(env(safe-area-inset-top,0px)+16px)] left-4 right-4 md:left-auto md:right-6 md:max-w-md z-50 flex items-start justify-between gap-3 p-3.5 rounded-2xl shadow-xl border bg-rose-50 border-rose-200 text-rose-800 dark:bg-rose-950/80 dark:border-rose-800 dark:text-rose-200 text-xs md:text-sm font-semibold transition-all duration-300 animate-in fade-in slide-in-from-top-4 backdrop-blur-md">
          <div className="flex items-start gap-2.5 flex-1 min-w-0">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 dark:text-rose-400 mt-0.5" />
            <span className="leading-snug break-words">{errorMsg}</span>
          </div>
          <button 
            type="button"
            onClick={() => setErrorMsg(null)} 
            className="p-1 -mr-1 -mt-1 rounded-lg text-rose-600 hover:text-rose-800 dark:text-rose-400 dark:hover:text-rose-200 hover:bg-rose-100/50 dark:hover:bg-rose-900/50 transition-colors cursor-pointer shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Header Bar */}
      <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
        <div className="flex items-center gap-4 min-w-0">
          <button
            type="button"
            onClick={() => {
              if (activeSubmodule === 'launcher') {
                if (onBackToDashboard) onBackToDashboard();
              } else if (activeSubmodule === 'trips') {
                handleBackFromTrips();
              } else if (activeSubmodule === 'claims') {
                handleBackFromClaims();
              } else if (activeSubmodule === 'advances') {
                handleBackFromAdvances();
              } else {
                handleBackFromExpenses();
              }
            }}
            className="w-9 h-9 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-350 cursor-pointer active:scale-95 transition-transform shrink-0"
          >
            <ArrowLeft className="w-4.5 h-4.5" />
          </button>

          <div className="min-w-0">
            <h2 className="text-xl md:text-2xl font-bold text-slate-800 dark:text-slate-100 truncate">
              {activeSubmodule === 'launcher' 
                ? 'Expenses & Travel' 
                : activeSubmodule === 'trips'
                  ? (showTripForm ? 'New Trip Request' : 'Trips')
                  : activeSubmodule === 'claims'
                    ? (showClaimForm ? 'New Expense Claim' : 'Expense Claims')
                    : activeSubmodule === 'advances'
                      ? (showAdvanceForm ? 'New Advance Request' : 'Advances')
                      : (showApplyForm ? 'Add Expense' 
                      : 'Expenses')}
            </h2>
            {activeSubmodule !== 'launcher' && (
              <p className="text-xs text-slate-400 dark:text-slate-500 font-semibold mt-0.5 truncate">
                {activeSubmodule === 'trips'
                  ? (showTripForm ? 'Create travel request with flight & hotel preferences' : 'Track and manage your travel requests')
                  : activeSubmodule === 'claims'
                    ? (showClaimForm ? 'Bundle expenses & submit reimbursement claim' : 'Track and manage your claims history')
                    : activeSubmodule === 'advances'
                      ? (showAdvanceForm ? 'Request cash or travel advance allowance' : 'Track and manage your advance requests')
                      : (showApplyForm ? 'Upload your receipt to submit' : 'Track and manage your claims history')}
              </p>
            )}
          </div>
        </div>

        {activeSubmodule === 'advances' && !showAdvanceForm && (
          <button
            type="button"
            onClick={handleOpenNewAdvance}
            className="px-3.5 py-2 bg-primary hover:bg-primary-hover text-white font-bold rounded-2xl text-xs uppercase tracking-wider flex items-center gap-1.5 shadow-sm shadow-primary/20 active:scale-95 transition-all cursor-pointer shrink-0 ml-2"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">New Advance</span>
            <span className="sm:hidden">New</span>
          </button>
        )}
      </div>

      {activeSubmodule === 'launcher' ? (
        /* ==================== HUB LAUNCHER (Image 2) ==================== */
        <div className="flex flex-col gap-4 animate-in fade-in duration-200">
          <div className="flex flex-col gap-3.5">
            {/* 1. Trips (Active Screen) */}
            <button
              type="button"
              onClick={handleOpenTrips}
              className="w-full flex items-center justify-between p-4 bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800/60 hover:border-sky-200 dark:hover:border-sky-900/40 transition-all cursor-pointer group active:scale-[0.99]"
            >
              <div className="flex items-center gap-3.5 min-w-0">
                <div className="w-12 h-12 rounded-2xl bg-sky-50 dark:bg-sky-950/30 text-sky-500 border border-sky-100 dark:border-sky-900/40 flex items-center justify-center shrink-0">
                  <Plane className="w-6 h-6" />
                </div>
                <div className="flex flex-col text-left min-w-0">
                  <span className="text-sm font-bold text-slate-800 dark:text-slate-200">
                    Trips
                  </span>
                  <span className="text-xs text-slate-400 dark:text-slate-500 font-medium truncate">
                    Travel requests, flights & hotel itineraries
                  </span>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-slate-300 dark:text-slate-600 group-hover:translate-x-0.5 transition-transform shrink-0 ml-2" />
            </button>

            {/* 2. Expense Claims (Active Screen) */}
            <button
              type="button"
              onClick={handleOpenClaims}
              className="w-full flex items-center justify-between p-4 bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800/60 hover:border-indigo-200 dark:hover:border-indigo-900/40 transition-all cursor-pointer group active:scale-[0.99]"
            >
              <div className="flex items-center gap-3.5 min-w-0">
                <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/30 text-indigo-500 border border-indigo-100 dark:border-indigo-900/40 flex items-center justify-center shrink-0">
                  <FileText className="w-6 h-6" />
                </div>
                <div className="flex flex-col text-left min-w-0">
                  <span className="text-sm font-bold text-slate-800 dark:text-slate-200">
                    Expense Claims
                  </span>
                  <span className="text-xs text-slate-400 dark:text-slate-500 font-medium truncate">
                    Bundle expenses & submit reimbursement claims
                  </span>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-slate-300 dark:text-slate-600 group-hover:translate-x-0.5 transition-transform shrink-0 ml-2" />
            </button>

            {/* 3. Advances (Active Screen) */}
            <button
              type="button"
              onClick={handleOpenAdvances}
              className="w-full flex items-center justify-between p-4 bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800/60 hover:border-emerald-200 dark:hover:border-emerald-900/40 transition-all cursor-pointer group active:scale-[0.99]"
            >
              <div className="flex items-center gap-3.5 min-w-0">
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 text-emerald-500 border border-emerald-100 dark:border-emerald-900/40 flex items-center justify-center shrink-0">
                  <Wallet className="w-6 h-6" />
                </div>
                <div className="flex flex-col text-left min-w-0">
                  <span className="text-sm font-bold text-slate-800 dark:text-slate-200">
                    Advances
                  </span>
                  <span className="text-xs text-slate-400 dark:text-slate-500 font-medium truncate">
                    Request travel or cash advance before trips
                  </span>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-slate-300 dark:text-slate-600 group-hover:translate-x-0.5 transition-transform shrink-0 ml-2" />
            </button>

            {/* 4. Expenses (Active Screen) */}
            <button
              type="button"
              onClick={handleOpenExpenses}
              className="w-full flex items-center justify-between p-4 bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800/60 hover:border-amber-200 dark:hover:border-amber-900/40 transition-all cursor-pointer group active:scale-[0.99]"
            >
              <div className="flex items-center gap-3.5 min-w-0">
                <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-950/30 text-amber-500 border border-amber-100 dark:border-amber-900/40 flex items-center justify-center shrink-0">
                  <Receipt className="w-6 h-6" />
                </div>
                <div className="flex flex-col text-left min-w-0">
                  <span className="text-sm font-bold text-slate-800 dark:text-slate-200">
                    Expenses
                  </span>
                  <span className="text-xs text-slate-400 dark:text-slate-500 font-medium truncate">
                    Capture receipts and line-item transactions
                  </span>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-slate-300 dark:text-slate-600 group-hover:translate-x-0.5 transition-transform shrink-0 ml-2" />
            </button>
          </div>
        </div>
      ) : activeSubmodule === 'trips' ? (
        /* ==================== TRIPS SUBMODULE ==================== */
        isTripsLoading && !showTripForm && trips.length === 0 ? (
          <div className="flex flex-col gap-6 py-8">
            <div className="grid grid-cols-2 gap-4">
              <div className="h-20 bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800/60 animate-pulse" />
              <div className="h-20 bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800/60 animate-pulse" />
            </div>
            <div className="h-4 bg-slate-100 dark:bg-slate-800 rounded w-1/4 animate-pulse mt-4" />
            <div className="h-48 bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800/60 animate-pulse" />
          </div>
        ) : showTripForm ? (
          /* New Trip Request Form */
          <form noValidate onSubmit={(e) => handleTripSubmit(e, 'submit')} className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-100 dark:border-slate-800/60 shadow-sm flex flex-col gap-5">
            {/* Trip Name */}
            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Trip Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={tripName}
                onChange={(e) => setTripName(e.target.value)}
                placeholder="e.g. Annual Tech Conference / Client Meeting"
                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent dark:text-slate-200"
              />
            </div>

            {/* Travel Type: Domestic vs International */}
            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Travel Type <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setTravelType('domestic')}
                  className={`py-3 px-4 rounded-2xl border text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                    travelType === 'domestic'
                      ? 'bg-sky-50 dark:bg-sky-950/40 border-sky-300 dark:border-sky-800 text-sky-700 dark:text-sky-300 shadow-sm'
                      : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100'
                  }`}
                >
                  <MapPin className="w-4 h-4" />
                  <span>Domestic</span>
                </button>
                <button
                  type="button"
                  onClick={() => setTravelType('international')}
                  className={`py-3 px-4 rounded-2xl border text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                    travelType === 'international'
                      ? 'bg-sky-50 dark:bg-sky-950/40 border-sky-300 dark:border-sky-800 text-sky-700 dark:text-sky-300 shadow-sm'
                      : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100'
                  }`}
                >
                  <Globe className="w-4 h-4" />
                  <span>International</span>
                </button>
              </div>
            </div>

            {/* International Travel details */}
            {travelType === 'international' && (
              <div className="p-4 bg-sky-50/40 dark:bg-sky-950/20 border border-sky-100 dark:border-sky-900/30 rounded-2xl flex flex-col gap-4 animate-in fade-in duration-200">
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                    Destination Country <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={destinationCountry}
                    onChange={(e) => setDestinationCountry(e.target.value)}
                    placeholder="e.g. Singapore, United States, Germany..."
                    className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-primary dark:text-slate-200"
                  />
                </div>

                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isVisaRequired}
                    onChange={(e) => setIsVisaRequired(e.target.checked)}
                    className="w-4 h-4 rounded text-sky-600 focus:ring-sky-500 border-slate-300 dark:border-slate-700"
                  />
                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Visa required for this trip
                  </span>
                </label>
              </div>
            )}

            {/* Project & Estimated Budget */}
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Project <span className="text-slate-400 text-[10px] font-normal">(Optional)</span>
                </label>
                <select
                  value={selectedTripProjectId}
                  onChange={(e) => setSelectedTripProjectId(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent dark:text-slate-200 truncate"
                >
                  <option value="">-- No Project --</option>
                  {projects.map((p) => (
                    <option key={p.id} value={p.id.toString()}>
                      {p.project_name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Est. Budget <span className="text-slate-400 text-[10px] font-normal">(Optional)</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={tripBudget}
                  onChange={(e) => setTripBudget(e.target.value)}
                  placeholder="0.00"
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent dark:text-slate-200"
                />
              </div>
            </div>

            {/* Business Purpose */}
            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Purpose / Objectives <span className="text-slate-400 text-[10px] font-normal">(Optional)</span>
              </label>
              <textarea
                rows={3}
                value={tripPurpose}
                onChange={(e) => setTripPurpose(e.target.value)}
                placeholder="Describe business purpose and goals for this travel..."
                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent dark:text-slate-200"
              />
            </div>

            {/* Travel Preferences (Seat & Meal) */}
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Seat Preference
                </label>
                <select
                  value={seatPreference}
                  onChange={(e) => setSeatPreference(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent dark:text-slate-200"
                >
                  <option value="">No Preference</option>
                  <option value="window">Window</option>
                  <option value="aisle">Aisle</option>
                  <option value="middle">Middle</option>
                </select>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Meal Preference
                </label>
                <select
                  value={mealPreference}
                  onChange={(e) => setMealPreference(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent dark:text-slate-200"
                >
                  <option value="">No Preference</option>
                  <option value="veg">Vegetarian</option>
                  <option value="non_veg">Non-Vegetarian</option>
                  <option value="vegan">Vegan</option>
                  <option value="jain">Jain Meal</option>
                </select>
              </div>
            </div>

            {/* Trip Itinerary Section */}
            <div className="border border-slate-200/90 dark:border-slate-800 rounded-2xl bg-white dark:bg-slate-900 p-4 shadow-sm flex flex-col gap-3">
              {/* Header Card */}
              <div
                className="flex items-center justify-between cursor-pointer select-none"
                onClick={() => setIsItineraryEnabled((prev) => !prev)}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                    <Calendar className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100">
                        Trip Itinerary
                      </h4>
                      <span className="text-[11px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 px-2 py-0.5 rounded-full border border-slate-200/60 dark:border-slate-700">
                        Optional
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      Add travel dates, destinations and other details
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2.5">
                  <button
                    type="button"
                    role="switch"
                    aria-checked={isItineraryEnabled}
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsItineraryEnabled((prev) => !prev);
                    }}
                    className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${
                      isItineraryEnabled ? 'bg-primary' : 'bg-slate-200 dark:bg-slate-700'
                    }`}
                  >
                    <span
                      className={`block w-5 h-5 rounded-full bg-white shadow-sm transition-transform ${
                        isItineraryEnabled ? 'translate-x-[22px]' : 'translate-x-0.5'
                      }`}
                    />
                  </button>
                  <ChevronDown
                    className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${
                      isItineraryEnabled ? 'rotate-180' : ''
                    }`}
                  />
                </div>
              </div>

              {/* Collapsible Section when Itinerary is Enabled */}
              {isItineraryEnabled && (
                <div className="mt-2 pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-col gap-3.5 animate-in fade-in duration-200">
                  {/* Action Buttons: 5 dashed pills */}
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={addFlightToItinerary}
                      className="px-3 py-2 rounded-xl border border-dashed border-sky-400 dark:border-sky-500 bg-white dark:bg-slate-900 hover:bg-sky-50/70 dark:hover:bg-sky-950/20 text-sky-600 dark:text-sky-400 text-xs font-bold flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer"
                    >
                      <span className="text-sm leading-none">+</span> Add Flight
                    </button>
                    <button
                      type="button"
                      onClick={addHotelToItinerary}
                      className="px-3 py-2 rounded-xl border border-dashed border-sky-400 dark:border-sky-500 bg-white dark:bg-slate-900 hover:bg-sky-50/70 dark:hover:bg-sky-950/20 text-sky-600 dark:text-sky-400 text-xs font-bold flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer"
                    >
                      <span className="text-sm leading-none">+</span> Add Hotel
                    </button>
                    <button
                      type="button"
                      onClick={addCarRentalToItinerary}
                      className="px-3 py-2 rounded-xl border border-dashed border-sky-400 dark:border-sky-500 bg-white dark:bg-slate-900 hover:bg-sky-50/70 dark:hover:bg-sky-950/20 text-sky-600 dark:text-sky-400 text-xs font-bold flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer"
                    >
                      <span className="text-sm leading-none">+</span> Add Car Rental
                    </button>
                    <button
                      type="button"
                      onClick={addBusToItinerary}
                      className="px-3 py-2 rounded-xl border border-dashed border-sky-400 dark:border-sky-500 bg-white dark:bg-slate-900 hover:bg-sky-50/70 dark:hover:bg-sky-950/20 text-sky-600 dark:text-sky-400 text-xs font-bold flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer"
                    >
                      <span className="text-sm leading-none">+</span> Add Bus
                    </button>
                    <button
                      type="button"
                      onClick={addTrainToItinerary}
                      className="px-3 py-2 rounded-xl border border-dashed border-sky-400 dark:border-sky-500 bg-white dark:bg-slate-900 hover:bg-sky-50/70 dark:hover:bg-sky-950/20 text-sky-600 dark:text-sky-400 text-xs font-bold flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer"
                    >
                      <span className="text-sm leading-none">+</span> Add Train
                    </button>
                  </div>

                  {/* Empty state when 0 items */}
                  {itineraryItems.length === 0 && (
                    <div className="py-7 px-4 rounded-xl border border-dashed border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/30 text-center flex flex-col items-center justify-center gap-2">
                      <MapPin className="w-6 h-6 text-slate-400 dark:text-slate-500" />
                      <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm">
                        Click on any option above to add flights, hotels, car rentals, buses, or trains to this trip.
                      </p>
                    </div>
                  )}

                  {/* Dynamic item cards */}
                  {itineraryItems.length > 0 && (
                    <div className="flex flex-col gap-3.5">
                      {itineraryItems.map((item) => {
                        if (item.type === 'flight') {
                          return (
                            <div
                              key={item.id}
                              className="border border-slate-200 dark:border-slate-800 rounded-2xl p-3.5 bg-slate-50/40 dark:bg-slate-950/50 flex flex-col gap-3 shadow-xs"
                            >
                              {/* Flight Header */}
                              <div className="flex items-center justify-between pb-2.5 border-b border-slate-200/70 dark:border-slate-800">
                                <div className="flex items-center gap-2">
                                  <span className="bg-sky-500 text-white text-[11px] font-bold px-2.5 py-0.5 rounded-lg flex items-center gap-1.5 shadow-xs">
                                    <Plane className="w-3.5 h-3.5" /> Flight
                                  </span>
                                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                                    Flight Details
                                  </span>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => removeItineraryItem(item.id)}
                                  className="text-rose-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                                  title="Remove flight"
                                >
                                  <Trash2 className="w-3.5 h-3.5" /> Remove
                                </button>
                              </div>

                              {/* Flight Depart & Arrive with Swap button */}
                              <div className="grid grid-cols-1 sm:grid-cols-[1fr,auto,1fr] gap-2 items-end">
                                <div className="flex flex-col gap-1.5">
                                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                                    Depart From
                                  </label>
                                  <input
                                    type="text"
                                    value={item.depart_from}
                                    onChange={(e) => updateItineraryItem(item.id, { depart_from: e.target.value })}
                                    placeholder="City / Airport"
                                    className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-sky-500"
                                  />
                                </div>
                                <div className="flex items-center justify-center sm:pb-0.5">
                                  <button
                                    type="button"
                                    onClick={() =>
                                      updateItineraryItem(item.id, {
                                        depart_from: item.arrive_at,
                                        arrive_at: item.depart_from,
                                      })
                                    }
                                    title="Swap cities"
                                    className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
                                  >
                                    <ArrowUpDown className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                                <div className="flex flex-col gap-1.5">
                                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                                    Arrive At
                                  </label>
                                  <input
                                    type="text"
                                    value={item.arrive_at}
                                    onChange={(e) => updateItineraryItem(item.id, { arrive_at: e.target.value })}
                                    placeholder="City / Airport"
                                    className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-sky-500"
                                  />
                                </div>
                              </div>

                              {/* Dates & Preferences */}
                              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                                <div className="flex flex-col gap-1.5">
                                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                                    Departure Date
                                  </label>
                                  <input
                                    type="date"
                                    value={item.departure_date}
                                    onChange={(e) => updateItineraryItem(item.id, { departure_date: e.target.value })}
                                    className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-sky-500"
                                  />
                                </div>
                                <div className="flex flex-col gap-1.5">
                                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                                    Trip Type
                                  </label>
                                  <select
                                    value={item.trip_type}
                                    onChange={(e) => updateItineraryItem(item.id, { trip_type: e.target.value as any })}
                                    className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-sky-500"
                                  >
                                    <option value="one_way">One Way</option>
                                    <option value="round_trip">Round Trip</option>
                                  </select>
                                </div>
                                <div className="flex flex-col gap-1.5">
                                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                                    Flight Class
                                  </label>
                                  <select
                                    value={item.flight_class}
                                    onChange={(e) => updateItineraryItem(item.id, { flight_class: e.target.value })}
                                    className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-sky-500"
                                  >
                                    <option value="Economy">Economy</option>
                                    <option value="Premium Economy">Premium Economy</option>
                                    <option value="Business">Business</option>
                                    <option value="First Class">First Class</option>
                                  </select>
                                </div>
                                <div className="flex flex-col gap-1.5">
                                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                                    Time Preference
                                  </label>
                                  <select
                                    value={item.time_preference}
                                    onChange={(e) => updateItineraryItem(item.id, { time_preference: e.target.value })}
                                    className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-sky-500"
                                  >
                                    <option value="Any time">Any time</option>
                                    <option value="Early Morning (12 AM - 6 AM)">Early Morning (12 AM - 6 AM)</option>
                                    <option value="Morning (6 AM - 12 PM)">Morning (6 AM - 12 PM)</option>
                                    <option value="Afternoon (12 PM - 6 PM)">Afternoon (12 PM - 6 PM)</option>
                                    <option value="Evening / Night (6 PM - 12 AM)">Evening / Night (6 PM - 12 AM)</option>
                                  </select>
                                </div>
                              </div>

                              {/* Description */}
                              <div className="flex flex-col gap-1.5">
                                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                                  Description / Notes
                                </label>
                                <input
                                  type="text"
                                  value={item.description}
                                  onChange={(e) => updateItineraryItem(item.id, { description: e.target.value })}
                                  placeholder="e.g. Morning flight preferred, Indigo / Air India"
                                  className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-sky-500"
                                />
                              </div>
                            </div>
                          );
                        }

                        if (item.type === 'hotel') {
                          return (
                            <div
                              key={item.id}
                              className="border border-slate-200 dark:border-slate-800 rounded-2xl p-3.5 bg-slate-50/40 dark:bg-slate-950/50 flex flex-col gap-3 shadow-xs"
                            >
                              {/* Hotel Header */}
                              <div className="flex items-center justify-between pb-2.5 border-b border-slate-200/70 dark:border-slate-800">
                                <div className="flex items-center gap-2">
                                  <span className="bg-cyan-600 text-white text-[11px] font-bold px-2.5 py-0.5 rounded-lg flex items-center gap-1.5 shadow-xs">
                                    <Building2 className="w-3.5 h-3.5" /> Hotel
                                  </span>
                                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                                    Hotel Accommodation
                                  </span>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => removeItineraryItem(item.id)}
                                  className="text-rose-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                                  title="Remove hotel"
                                >
                                  <Trash2 className="w-3.5 h-3.5" /> Remove
                                </button>
                              </div>

                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                                <div className="flex flex-col gap-1.5">
                                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                                    City / Location
                                  </label>
                                  <input
                                    type="text"
                                    value={item.city}
                                    onChange={(e) => updateItineraryItem(item.id, { city: e.target.value })}
                                    placeholder="e.g. Goa, Calangute"
                                    className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                                  />
                                </div>
                                <div className="flex flex-col gap-1.5">
                                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                                    Hotel Preference
                                  </label>
                                  <input
                                    type="text"
                                    value={item.hotel_name}
                                    onChange={(e) => updateItineraryItem(item.id, { hotel_name: e.target.value })}
                                    placeholder="e.g. 4-Star or specific hotel"
                                    className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                                  />
                                </div>
                              </div>

                              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                                <div className="flex flex-col gap-1.5">
                                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                                    Check-in Date
                                  </label>
                                  <input
                                    type="date"
                                    value={item.check_in_date}
                                    onChange={(e) => updateItineraryItem(item.id, { check_in_date: e.target.value })}
                                    className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                                  />
                                </div>
                                <div className="flex flex-col gap-1.5">
                                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                                    Check-out Date
                                  </label>
                                  <input
                                    type="date"
                                    value={item.check_out_date}
                                    onChange={(e) => updateItineraryItem(item.id, { check_out_date: e.target.value })}
                                    className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                                  />
                                </div>
                                <div className="flex flex-col gap-1.5">
                                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                                    Room Type
                                  </label>
                                  <select
                                    value={item.room_type}
                                    onChange={(e) => updateItineraryItem(item.id, { room_type: e.target.value })}
                                    className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                                  >
                                    <option value="Single Standard">Single Standard Room</option>
                                    <option value="Double / Twin">Double / Twin Room</option>
                                    <option value="Deluxe Room">Deluxe Room</option>
                                    <option value="Executive Suite">Executive Suite</option>
                                    <option value="Any Available">Any Available</option>
                                  </select>
                                </div>
                              </div>

                              <div className="flex flex-col gap-1.5">
                                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                                  Description / Special Requests
                                </label>
                                <input
                                  type="text"
                                  value={item.description}
                                  onChange={(e) => updateItineraryItem(item.id, { description: e.target.value })}
                                  placeholder="Special requests, near client office, early check-in, etc."
                                  className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                                />
                              </div>
                            </div>
                          );
                        }

                        if (item.type === 'car') {
                          return (
                            <div
                              key={item.id}
                              className="border border-slate-200 dark:border-slate-800 rounded-2xl p-3.5 bg-slate-50/40 dark:bg-slate-950/50 flex flex-col gap-3 shadow-xs"
                            >
                              {/* Car Header */}
                              <div className="flex items-center justify-between pb-2.5 border-b border-slate-200/70 dark:border-slate-800">
                                <div className="flex items-center gap-2">
                                  <span className="bg-emerald-600 text-white text-[11px] font-bold px-2.5 py-0.5 rounded-lg flex items-center gap-1.5 shadow-xs">
                                    <Car className="w-3.5 h-3.5" /> Car Rental
                                  </span>
                                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                                    Car Rental / Cab
                                  </span>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => removeItineraryItem(item.id)}
                                  className="text-rose-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                                  title="Remove car rental"
                                >
                                  <Trash2 className="w-3.5 h-3.5" /> Remove
                                </button>
                              </div>

                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                                <div className="flex flex-col gap-1.5">
                                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                                    Pick-up Location
                                  </label>
                                  <input
                                    type="text"
                                    value={item.pickup_location}
                                    onChange={(e) => updateItineraryItem(item.id, { pickup_location: e.target.value })}
                                    placeholder="e.g. Airport / Office address"
                                    className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                                  />
                                </div>
                                <div className="flex flex-col gap-1.5">
                                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                                    Drop-off Location
                                  </label>
                                  <input
                                    type="text"
                                    value={item.dropoff_location}
                                    onChange={(e) => updateItineraryItem(item.id, { dropoff_location: e.target.value })}
                                    placeholder="e.g. Hotel / Airport"
                                    className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                                  />
                                </div>
                              </div>

                              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                                <div className="flex flex-col gap-1.5">
                                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                                    Pick-up Date
                                  </label>
                                  <input
                                    type="date"
                                    value={item.pickup_date}
                                    onChange={(e) => updateItineraryItem(item.id, { pickup_date: e.target.value })}
                                    className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                                  />
                                </div>
                                <div className="flex flex-col gap-1.5">
                                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                                    Drop-off Date
                                  </label>
                                  <input
                                    type="date"
                                    value={item.dropoff_date}
                                    onChange={(e) => updateItineraryItem(item.id, { dropoff_date: e.target.value })}
                                    className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                                  />
                                </div>
                                <div className="flex flex-col gap-1.5 col-span-2 sm:col-span-1">
                                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                                    Car Type
                                  </label>
                                  <select
                                    value={item.car_type}
                                    onChange={(e) => updateItineraryItem(item.id, { car_type: e.target.value })}
                                    className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                                  >
                                    <option value="Sedan">Sedan</option>
                                    <option value="SUV">SUV</option>
                                    <option value="Hatchback">Hatchback</option>
                                    <option value="Compact / Mini">Compact / Mini</option>
                                    <option value="Luxury">Luxury</option>
                                    <option value="Any Available">Any Available</option>
                                  </select>
                                </div>
                              </div>

                              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                                <div className="flex flex-col gap-1.5">
                                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                                    Pick-up Time
                                  </label>
                                  <input
                                    type="text"
                                    value={item.pickup_time}
                                    onChange={(e) => updateItineraryItem(item.id, { pickup_time: e.target.value })}
                                    placeholder="e.g. 09:00 AM"
                                    className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                                  />
                                </div>
                                <div className="flex flex-col gap-1.5">
                                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                                    Drop-off Time
                                  </label>
                                  <input
                                    type="text"
                                    value={item.dropoff_time}
                                    onChange={(e) => updateItineraryItem(item.id, { dropoff_time: e.target.value })}
                                    placeholder="e.g. 06:00 PM"
                                    className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                                  />
                                </div>
                                <div className="flex flex-col gap-1.5">
                                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                                    Driver Required?
                                  </label>
                                  <select
                                    value={item.driver_required ? '1' : '0'}
                                    onChange={(e) => updateItineraryItem(item.id, { driver_required: e.target.value === '1' })}
                                    className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                                  >
                                    <option value="0">No (Self Drive)</option>
                                    <option value="1">Yes (With Driver)</option>
                                  </select>
                                </div>
                              </div>

                              <div className="flex flex-col gap-1.5">
                                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                                  Description / Notes
                                </label>
                                <input
                                  type="text"
                                  value={item.description}
                                  onChange={(e) => updateItineraryItem(item.id, { description: e.target.value })}
                                  placeholder="Special requirements, luggage space, etc."
                                  className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                                />
                              </div>
                            </div>
                          );
                        }

                        if (item.type === 'bus') {
                          return (
                            <div
                              key={item.id}
                              className="border border-slate-200 dark:border-slate-800 rounded-2xl p-3.5 bg-slate-50/40 dark:bg-slate-950/50 flex flex-col gap-3 shadow-xs"
                            >
                              {/* Bus Header */}
                              <div className="flex items-center justify-between pb-2.5 border-b border-slate-200/70 dark:border-slate-800">
                                <div className="flex items-center gap-2">
                                  <span className="bg-amber-500 text-white text-[11px] font-bold px-2.5 py-0.5 rounded-lg flex items-center gap-1.5 shadow-xs">
                                    <Bus className="w-3.5 h-3.5" /> Bus
                                  </span>
                                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                                    Bus Details
                                  </span>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => removeItineraryItem(item.id)}
                                  className="text-rose-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                                  title="Remove bus"
                                >
                                  <Trash2 className="w-3.5 h-3.5" /> Remove
                                </button>
                              </div>

                              <div className="grid grid-cols-1 sm:grid-cols-[1fr,auto,1fr] gap-2 items-end">
                                <div className="flex flex-col gap-1.5">
                                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                                    Depart From
                                  </label>
                                  <input
                                    type="text"
                                    value={item.depart_from}
                                    onChange={(e) => updateItineraryItem(item.id, { depart_from: e.target.value })}
                                    placeholder="City / Bus Terminal"
                                    className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-amber-500"
                                  />
                                </div>
                                <div className="flex items-center justify-center sm:pb-0.5">
                                  <button
                                    type="button"
                                    onClick={() =>
                                      updateItineraryItem(item.id, {
                                        depart_from: item.arrive_at,
                                        arrive_at: item.depart_from,
                                      })
                                    }
                                    title="Swap cities"
                                    className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
                                  >
                                    <ArrowUpDown className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                                <div className="flex flex-col gap-1.5">
                                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                                    Arrive At
                                  </label>
                                  <input
                                    type="text"
                                    value={item.arrive_at}
                                    onChange={(e) => updateItineraryItem(item.id, { arrive_at: e.target.value })}
                                    placeholder="City / Bus Terminal"
                                    className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-amber-500"
                                  />
                                </div>
                              </div>

                              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                                <div className="flex flex-col gap-1.5">
                                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                                    Departure Date
                                  </label>
                                  <input
                                    type="date"
                                    value={item.departure_date}
                                    onChange={(e) => updateItineraryItem(item.id, { departure_date: e.target.value })}
                                    className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-amber-500"
                                  />
                                </div>
                                <div className="flex flex-col gap-1.5">
                                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                                    Bus Type
                                  </label>
                                  <select
                                    value={item.bus_type}
                                    onChange={(e) => updateItineraryItem(item.id, { bus_type: e.target.value })}
                                    className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-amber-500"
                                  >
                                    <option value="AC Sleeper">AC Sleeper</option>
                                    <option value="AC Semi-Sleeper">AC Semi-Sleeper</option>
                                    <option value="Non-AC Sleeper">Non-AC Sleeper</option>
                                    <option value="Volvo / Luxury">Volvo / Luxury</option>
                                    <option value="Standard / Seater">Standard / Seater</option>
                                    <option value="Any Available">Any Available</option>
                                  </select>
                                </div>
                                <div className="flex flex-col gap-1.5">
                                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                                    Time Preference
                                  </label>
                                  <select
                                    value={item.time_preference}
                                    onChange={(e) => updateItineraryItem(item.id, { time_preference: e.target.value })}
                                    className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-amber-500"
                                  >
                                    <option value="Any time">Any time</option>
                                    <option value="Early Morning (12 AM - 6 AM)">Early Morning (12 AM - 6 AM)</option>
                                    <option value="Morning (6 AM - 12 PM)">Morning (6 AM - 12 PM)</option>
                                    <option value="Afternoon (12 PM - 6 PM)">Afternoon (12 PM - 6 PM)</option>
                                    <option value="Evening / Night (6 PM - 12 AM)">Evening / Night (6 PM - 12 AM)</option>
                                  </select>
                                </div>
                              </div>

                              <div className="flex flex-col gap-1.5">
                                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                                  Description / Seat Preference
                                </label>
                                <input
                                  type="text"
                                  value={item.description}
                                  onChange={(e) => updateItineraryItem(item.id, { description: e.target.value })}
                                  placeholder="Description / Seat preference / Boarding point"
                                  className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-amber-500"
                                />
                              </div>
                            </div>
                          );
                        }

                        if (item.type === 'train') {
                          return (
                            <div
                              key={item.id}
                              className="border border-slate-200 dark:border-slate-800 rounded-2xl p-3.5 bg-slate-50/40 dark:bg-slate-950/50 flex flex-col gap-3 shadow-xs"
                            >
                              {/* Train Header */}
                              <div className="flex items-center justify-between pb-2.5 border-b border-slate-200/70 dark:border-slate-800">
                                <div className="flex items-center gap-2">
                                  <span className="bg-indigo-600 text-white text-[11px] font-bold px-2.5 py-0.5 rounded-lg flex items-center gap-1.5 shadow-xs">
                                    <Train className="w-3.5 h-3.5" /> Train
                                  </span>
                                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                                    Train Details
                                  </span>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => removeItineraryItem(item.id)}
                                  className="text-rose-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                                  title="Remove train"
                                >
                                  <Trash2 className="w-3.5 h-3.5" /> Remove
                                </button>
                              </div>

                              <div className="grid grid-cols-1 sm:grid-cols-[1fr,auto,1fr] gap-2 items-end">
                                <div className="flex flex-col gap-1.5">
                                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                                    Depart From
                                  </label>
                                  <input
                                    type="text"
                                    value={item.depart_from}
                                    onChange={(e) => updateItineraryItem(item.id, { depart_from: e.target.value })}
                                    placeholder="Station / City"
                                    className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                  />
                                </div>
                                <div className="flex items-center justify-center sm:pb-0.5">
                                  <button
                                    type="button"
                                    onClick={() =>
                                      updateItineraryItem(item.id, {
                                        depart_from: item.arrive_at,
                                        arrive_at: item.depart_from,
                                      })
                                    }
                                    title="Swap stations"
                                    className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
                                  >
                                    <ArrowUpDown className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                                <div className="flex flex-col gap-1.5">
                                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                                    Arrive At
                                  </label>
                                  <input
                                    type="text"
                                    value={item.arrive_at}
                                    onChange={(e) => updateItineraryItem(item.id, { arrive_at: e.target.value })}
                                    placeholder="Station / City"
                                    className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                  />
                                </div>
                              </div>

                              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                                <div className="flex flex-col gap-1.5">
                                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                                    Departure Date
                                  </label>
                                  <input
                                    type="date"
                                    value={item.departure_date}
                                    onChange={(e) => updateItineraryItem(item.id, { departure_date: e.target.value })}
                                    className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                  />
                                </div>
                                <div className="flex flex-col gap-1.5">
                                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                                    Train Class
                                  </label>
                                  <select
                                    value={item.train_class}
                                    onChange={(e) => updateItineraryItem(item.id, { train_class: e.target.value })}
                                    className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                  >
                                    <option value="1st AC (1A)">1st AC (1A)</option>
                                    <option value="2nd AC (2A)">2nd AC (2A)</option>
                                    <option value="3rd AC (3A)">3rd AC (3A)</option>
                                    <option value="Executive Class (EC)">Executive Class (EC)</option>
                                    <option value="AC Chair Car (CC)">AC Chair Car (CC)</option>
                                    <option value="Sleeper (SL)">Sleeper (SL)</option>
                                    <option value="Any Available">Any Available</option>
                                  </select>
                                </div>
                                <div className="flex flex-col gap-1.5">
                                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                                    Time Preference
                                  </label>
                                  <select
                                    value={item.time_preference}
                                    onChange={(e) => updateItineraryItem(item.id, { time_preference: e.target.value })}
                                    className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                  >
                                    <option value="Any time">Any time</option>
                                    <option value="Early Morning (12 AM - 6 AM)">Early Morning (12 AM - 6 AM)</option>
                                    <option value="Morning (6 AM - 12 PM)">Morning (6 AM - 12 PM)</option>
                                    <option value="Afternoon (12 PM - 6 PM)">Afternoon (12 PM - 6 PM)</option>
                                    <option value="Evening / Night (6 PM - 12 AM)">Evening / Night (6 PM - 12 AM)</option>
                                  </select>
                                </div>
                              </div>

                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                                <div className="flex flex-col gap-1.5">
                                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                                    Train Name / Number
                                  </label>
                                  <input
                                    type="text"
                                    value={item.train_name_number}
                                    onChange={(e) => updateItineraryItem(item.id, { train_name_number: e.target.value })}
                                    placeholder="e.g. 12951 Mumbai Rajdhani"
                                    className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                  />
                                </div>
                                <div className="flex flex-col gap-1.5">
                                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                                    Description / Berth Preference
                                  </label>
                                  <input
                                    type="text"
                                    value={item.description}
                                    onChange={(e) => updateItineraryItem(item.id, { description: e.target.value })}
                                    placeholder="Berth preference (Lower, Upper, Side Lower, etc.)"
                                    className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                  />
                                </div>
                              </div>
                            </div>
                          );
                        }

                        return null;
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Action Buttons: Save Draft & Submit */}
            <div className="flex items-center gap-3 mt-2">
              <button
                type="button"
                disabled={isSubmittingTrip}
                onClick={(e) => handleTripSubmit(e, 'draft')}
                className="flex-1 py-4 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold rounded-2xl text-xs uppercase tracking-wider active:scale-[0.98] disabled:opacity-50 transition-all cursor-pointer"
              >
                Save as Draft
              </button>
              <button
                type="submit"
                disabled={isSubmittingTrip}
                className="flex-1 py-4 bg-primary hover:bg-primary-hover text-white font-bold rounded-2xl text-xs uppercase tracking-wider active:scale-[0.98] disabled:opacity-50 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-primary/10"
              >
                {isSubmittingTrip ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  'Submit Request'
                )}
              </button>
            </div>
          </form>
        ) : (
          /* Main Trips Dashboard */
          <div className="flex flex-col gap-8">
            {/* Stats Boxes */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-100 dark:border-slate-800/60 shadow-sm flex flex-col gap-1 transition-all hover:translate-y-[-1px]">
                <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                  Pending
                </span>
                <span className="text-2xl font-black text-amber-500">
                  {pendingTripsCount}
                </span>
              </div>
              <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-100 dark:border-slate-800/60 shadow-sm flex flex-col gap-1 transition-all hover:translate-y-[-1px]">
                <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                  Total Trips
                </span>
                <span className="text-2xl font-black text-primary dark:text-slate-200">
                  {totalTripsCount}
                </span>
              </div>
            </div>

            {/* Float Action Trigger */}
            <div className="my-2">
              <button
                type="button"
                onClick={handleOpenNewTrip}
                className="w-full py-4 bg-primary text-white font-bold rounded-2xl text-sm tracking-wider active:scale-[0.98] transition-all cursor-pointer flex items-center justify-center gap-2 shadow-md shadow-primary/10"
              >
                <Plus className="w-5 h-5" />
                <span>New Trip Request</span>
              </button>
            </div>

            {/* Trips History List */}
            <div className="flex flex-col gap-3">
              <h3 className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider px-1">
                Trip Requests History
              </h3>

              {isTripsLoading ? (
                <div className="flex flex-col gap-3">
                  <div className="h-24 bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800/60 animate-pulse" />
                  <div className="h-24 bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800/60 animate-pulse" />
                </div>
              ) : trips.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-slate-400 bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800/60 shadow-sm">
                  <Plane className="w-10 h-10 stroke-[1.5] text-slate-350 dark:text-slate-700" />
                  <h3 className="text-xs font-bold text-slate-500 mt-2">No travel requests recorded</h3>
                  <p className="text-[11px] text-slate-400 mt-1">Create a trip request for travel approvals & itineraries</p>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  {trips.map((trip) => {
                    const status = typeof trip.status === 'string' ? trip.status : 'Pending';
                    const travelType = typeof trip.travel_type === 'string' ? trip.travel_type : 'domestic';
                    const isIntl = travelType.toLowerCase() === 'international';
                    const countryName = getDestinationCountryName(trip);
                    const flightsCount = Array.isArray(trip.flights) ? trip.flights.length : 0;
                    const hotelsCount = Array.isArray(trip.hotels) ? trip.hotels.length : 0;
                    const carRentalsCount = Array.isArray(trip.carRentals || trip.car_rentals) ? (trip.carRentals || trip.car_rentals)!.length : 0;
                    const busesCount = Array.isArray(trip.buses) ? trip.buses.length : 0;
                    const trainsCount = Array.isArray(trip.trains) ? trip.trains.length : 0;
                    const durationStr = typeof trip.duration === 'string' ? trip.duration : '';

                    return (
                      <div
                        key={trip.id}
                        className="bg-white dark:bg-slate-900 rounded-3xl p-4 border border-slate-100 dark:border-slate-800/60 shadow-sm flex items-center gap-4 transition-transform hover:translate-y-[-1px] duration-150"
                      >
                        {/* Left Plane avatar wrapper */}
                        <div className="w-10 h-10 rounded-full bg-sky-50 dark:bg-sky-950/40 text-sky-500 flex items-center justify-center shrink-0 border border-sky-100/50 dark:border-sky-900/40 shadow-sm">
                          <Plane className="w-5 h-5" />
                        </div>

                        {/* Item Details */}
                        <div className="flex-1 flex flex-col min-w-0">
                          <span className="text-sm font-extrabold text-slate-800 dark:text-slate-200 truncate">
                            {trip.trip_name || `Trip #${trip.id}`}
                          </span>
                          <div className="flex items-center gap-2 text-[11px] text-slate-400 dark:text-slate-500 font-medium mt-1">
                            <span>{trip.trip_id || `TRIP-${trip.id}`}</span>
                            <span>•</span>
                            <span className="capitalize">{travelType}</span>
                            {trip.created_at && (
                              <>
                                <span>•</span>
                                <span>{formatDate(trip.created_at)}</span>
                              </>
                            )}
                          </div>

                          <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                            {isIntl && countryName && (
                              <span className="px-2 py-0.5 rounded-md text-[9px] font-bold bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-300 border border-sky-100 dark:border-sky-900/40">
                                📍 {countryName}
                              </span>
                            )}
                            {flightsCount > 0 && (
                              <span className="px-2 py-0.5 rounded-md text-[9px] font-bold bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border border-indigo-100 dark:border-indigo-900/40">
                                ✈️ {flightsCount} Flight{flightsCount > 1 ? 's' : ''}
                              </span>
                            )}
                            {hotelsCount > 0 && (
                              <span className="px-2 py-0.5 rounded-md text-[9px] font-bold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-100 dark:border-emerald-900/40">
                                🏨 {hotelsCount} Hotel{hotelsCount > 1 ? 's' : ''}
                              </span>
                            )}
                            {carRentalsCount > 0 && (
                              <span className="px-2 py-0.5 rounded-md text-[9px] font-bold bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-300 border border-teal-100 dark:border-teal-900/40">
                                🚗 {carRentalsCount} Car{carRentalsCount > 1 ? 's' : ''}
                              </span>
                            )}
                            {busesCount > 0 && (
                              <span className="px-2 py-0.5 rounded-md text-[9px] font-bold bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-100 dark:border-amber-900/40">
                                🚌 {busesCount} Bus{busesCount > 1 ? 'es' : ''}
                              </span>
                            )}
                            {trainsCount > 0 && (
                              <span className="px-2 py-0.5 rounded-md text-[9px] font-bold bg-violet-50 dark:bg-violet-950/40 text-violet-700 dark:text-violet-300 border border-violet-100 dark:border-violet-900/40">
                                🚆 {trainsCount} Train{trainsCount > 1 ? 's' : ''}
                              </span>
                            )}
                            {durationStr && (
                              <span className="px-2 py-0.5 rounded-md text-[9px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                                ⏱️ {durationStr}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Right details & status */}
                        <div className="flex flex-col items-end gap-1.5 shrink-0">
                          <span className={`px-2 py-0.5 rounded-lg text-[9px] font-bold uppercase tracking-wider border ${getTripStatusColor(status)}`}>
                            {status}
                          </span>
                          {trip.budget_amount && parseFloat(trip.budget_amount.toString()) > 0 && (
                            <span className="text-xs font-black text-slate-700 dark:text-slate-200">
                              ₹ {parseFloat(trip.budget_amount.toString()).toFixed(2)}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )
      ) : activeSubmodule === 'claims' ? (
        /* ==================== EXPENSE CLAIMS SUBMODULE ==================== */
        isClaimsLoading && !showClaimForm && claims.length === 0 ? (
          <div className="flex flex-col gap-6 py-8">
            <div className="grid grid-cols-2 gap-4">
              <div className="h-20 bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800/60 animate-pulse" />
              <div className="h-20 bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800/60 animate-pulse" />
            </div>
            <div className="h-4 bg-slate-100 dark:bg-slate-800 rounded w-1/4 animate-pulse mt-4" />
            <div className="h-48 bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800/60 animate-pulse" />
          </div>
        ) : showClaimForm ? (
          /* New Expense Claim Form */
          <form noValidate onSubmit={(e) => handleClaimSubmit(e, 'submit')} className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-100 dark:border-slate-800/60 shadow-sm flex flex-col gap-5">
            {/* Claim Title input */}
            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Claim Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={claimTitle}
                onChange={(e) => setClaimTitle(e.target.value)}
                placeholder="e.g. Client Meeting & Travel - Sep 2026"
                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent dark:text-slate-200"
              />
            </div>

            {/* Currency & Advance Amount */}
            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-1 flex flex-col gap-2">
                <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Currency
                </label>
                <select
                  value={claimCurrency}
                  onChange={(e) => setClaimCurrency(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent dark:text-slate-200"
                >
                  <option value="INR">₹ INR</option>
                  <option value="USD">$ USD</option>
                  <option value="EUR">€ EUR</option>
                </select>
              </div>

              <div className="col-span-2 flex flex-col gap-2">
                <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Advance Amount <span className="text-slate-400 text-[10px] font-normal">(Optional)</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={claimAdvanceAmount}
                  onChange={(e) => setClaimAdvanceAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent dark:text-slate-200"
                />
              </div>
            </div>

            {/* Advance Notes */}
            {parseFloat(claimAdvanceAmount) > 0 && (
              <div className="flex flex-col gap-2 animate-in fade-in duration-150">
                <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Advance Ref / Notes
                </label>
                <input
                  type="text"
                  value={claimAdvanceNotes}
                  onChange={(e) => setClaimAdvanceNotes(e.target.value)}
                  placeholder="e.g. Petty cash voucher #12"
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent dark:text-slate-200"
                />
              </div>
            )}

            {/* Business Purpose / Description */}
            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Business Purpose / Notes <span className="text-slate-400 text-[10px] font-normal">(Optional)</span>
              </label>
              <textarea
                rows={3}
                value={claimDescription}
                onChange={(e) => setClaimDescription(e.target.value)}
                placeholder="Brief explanation or purpose for this claim..."
                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent dark:text-slate-200"
              />
            </div>

            {/* Select Expenses to Include */}
            <div className="flex flex-col gap-3 pt-2">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                    Select Expenses to Include
                  </h4>
                  <p className="text-[11px] text-slate-400 dark:text-slate-500">
                    Check the draft expenses to bundle into this claim
                  </p>
                </div>
                {draftExpensesForClaim.length > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      if (selectedExpenseIdsForClaim.length === draftExpensesForClaim.length) {
                        setSelectedExpenseIdsForClaim([]);
                      } else {
                        setSelectedExpenseIdsForClaim(draftExpensesForClaim.map((d) => d.id));
                      }
                    }}
                    className="text-xs font-bold text-primary hover:underline cursor-pointer"
                  >
                    {selectedExpenseIdsForClaim.length === draftExpensesForClaim.length ? 'Deselect All' : 'Select All'}
                  </button>
                )}
              </div>

              {isLoadingDraftExpenses ? (
                <div className="flex items-center justify-center p-8 bg-slate-50 dark:bg-slate-950/50 rounded-2xl border border-slate-100 dark:border-slate-800">
                  <Loader2 className="w-5 h-5 text-primary animate-spin" />
                  <span className="text-xs text-slate-400 ml-2">Loading available expenses...</span>
                </div>
              ) : draftExpensesForClaim.length === 0 ? (
                <div className="p-4 bg-sky-50/50 dark:bg-sky-950/20 border border-sky-100 dark:border-sky-900/40 rounded-2xl text-xs text-sky-800 dark:text-sky-300 flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 text-sky-600 dark:text-sky-400 shrink-0 mt-0.5" />
                  <div className="leading-relaxed">
                    You don&apos;t have any unbundled draft expenses right now. You can create this claim container now and link expenses later, or add expenses first.
                  </div>
                </div>
              ) : (
                <div className="flex flex-col gap-2 max-h-60 overflow-y-auto pr-1">
                  {draftExpensesForClaim.map((draft) => {
                    const isChecked = selectedExpenseIdsForClaim.includes(draft.id);
                    const sym = getCurrencySymbol(draft);
                    return (
                      <label
                        key={draft.id}
                        className={`flex items-center justify-between p-3 rounded-2xl border transition-all cursor-pointer ${
                          isChecked
                            ? 'bg-primary/5 border-primary/40 dark:bg-primary/10 dark:border-primary/50'
                            : 'bg-slate-50 dark:bg-slate-950/60 border-slate-100 dark:border-slate-800 hover:border-slate-200'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedExpenseIdsForClaim([...selectedExpenseIdsForClaim, draft.id]);
                              } else {
                                setSelectedExpenseIdsForClaim(selectedExpenseIdsForClaim.filter((id) => id !== draft.id));
                              }
                            }}
                            className="w-4 h-4 rounded text-primary focus:ring-primary border-slate-300 dark:border-slate-700"
                          />
                          <div className="flex flex-col min-w-0">
                            <span className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                              {draft.item_name || 'Expense'}
                            </span>
                            <span className="text-[10px] text-slate-400 dark:text-slate-500">
                              {formatDate(draft.purchase_date)}
                            </span>
                          </div>
                        </div>
                        <span className="text-xs font-extrabold text-slate-700 dark:text-slate-200 shrink-0 ml-2">
                          {sym} {parseFloat(draft.price || '0').toFixed(2)}
                        </span>
                      </label>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Live Financial Summary */}
            <div className="p-4 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-100 dark:border-slate-800 flex flex-col gap-2">
              <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                <span>Total Selected ({selectedExpenseIdsForClaim.length} items)</span>
                <span className="font-bold text-slate-700 dark:text-slate-200">
                  {claimCurrency === 'USD' ? '$' : claimCurrency === 'EUR' ? '€' : '₹'} {subtotalSelected.toFixed(2)}
                </span>
              </div>
              {advanceDeduction > 0 && (
                <div className="flex items-center justify-between text-xs text-rose-500">
                  <span>Less Advance Applied</span>
                  <span className="font-bold">
                    - {claimCurrency === 'USD' ? '$' : claimCurrency === 'EUR' ? '€' : '₹'} {advanceDeduction.toFixed(2)}
                  </span>
                </div>
              )}
              <div className="border-t border-slate-200 dark:border-slate-800 pt-2 flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                  Net Payable
                </span>
                <span className="text-base font-black text-primary">
                  {claimCurrency === 'USD' ? '$' : claimCurrency === 'EUR' ? '€' : '₹'} {netPayable.toFixed(2)}
                </span>
              </div>
            </div>

            {/* Action Buttons: Save Draft & Submit */}
            <div className="flex items-center gap-3 mt-2">
              <button
                type="button"
                disabled={isSubmittingClaim}
                onClick={(e) => handleClaimSubmit(e, 'draft')}
                className="flex-1 py-4 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold rounded-2xl text-xs uppercase tracking-wider active:scale-[0.98] disabled:opacity-50 transition-all cursor-pointer"
              >
                Save as Draft
              </button>
              <button
                type="submit"
                disabled={isSubmittingClaim}
                className="flex-1 py-4 bg-primary hover:bg-primary-hover text-white font-bold rounded-2xl text-xs uppercase tracking-wider active:scale-[0.98] disabled:opacity-50 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-primary/10"
              >
                {isSubmittingClaim ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  'Submit Claim'
                )}
              </button>
            </div>
          </form>
        ) : (
          /* Main Expense Claims Dashboard */
          <div className="flex flex-col gap-8">
            {/* Stats Boxes */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-100 dark:border-slate-800/60 shadow-sm flex flex-col gap-1 transition-all hover:translate-y-[-1px]">
                <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                  Pending
                </span>
                <span className="text-2xl font-black text-amber-500">
                  {pendingClaimsCount}
                </span>
              </div>
              <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-100 dark:border-slate-800/60 shadow-sm flex flex-col gap-1 transition-all hover:translate-y-[-1px]">
                <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                  Total Claims
                </span>
                <span className="text-2xl font-black text-primary dark:text-slate-200">
                  {totalClaimsCount}
                </span>
              </div>
            </div>

            {/* Float Action Trigger */}
            <div className="my-2">
              <button
                type="button"
                onClick={handleOpenNewClaim}
                className="w-full py-4 bg-primary text-white font-bold rounded-2xl text-sm tracking-wider active:scale-[0.98] transition-all cursor-pointer flex items-center justify-center gap-2 shadow-md shadow-primary/10"
              >
                <Plus className="w-5 h-5" />
                <span>New Expense Claim</span>
              </button>
            </div>

            {/* Claims History List */}
            <div className="flex flex-col gap-3">
              <h3 className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider px-1">
                Expense Claims History
              </h3>

              {isClaimsLoading ? (
                <div className="flex flex-col gap-3">
                  <div className="h-24 bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800/60 animate-pulse" />
                  <div className="h-24 bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800/60 animate-pulse" />
                </div>
              ) : claims.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-slate-400 bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800/60 shadow-sm">
                  <FileText className="w-10 h-10 stroke-[1.5] text-slate-350 dark:text-slate-700" />
                  <h3 className="text-xs font-bold text-slate-500 mt-2">No expense claims recorded</h3>
                  <p className="text-[11px] text-slate-400 mt-1">Create a claim to bundle your expenses for reimbursement</p>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  {claims.map((claim) => {
                    const status = claim.status || 'Pending';
                    const symbol = getClaimCurrencySymbol(claim);
                    const claimAmount = (claim.net_payable_amount !== undefined && claim.net_payable_amount !== null)
                      ? claim.net_payable_amount
                      : (claim.total_amount || 0);
                    const expensesCount = claim.expenses?.length || 0;

                    return (
                      <div
                        key={claim.id}
                        className="bg-white dark:bg-slate-900 rounded-3xl p-4 border border-slate-100 dark:border-slate-800/60 shadow-sm flex items-center gap-4 transition-transform hover:translate-y-[-1px] duration-150"
                      >
                        {/* Left FileText avatar wrapper */}
                        <div className="w-10 h-10 rounded-full bg-indigo-50 dark:bg-indigo-950/40 text-indigo-500 flex items-center justify-center shrink-0 border border-indigo-100/50 dark:border-indigo-900/40 shadow-sm">
                          <FileText className="w-5 h-5" />
                        </div>

                        {/* Item Details */}
                        <div className="flex-1 flex flex-col min-w-0">
                          <span className="text-sm font-extrabold text-slate-800 dark:text-slate-200 truncate">
                            {claim.title || `Claim #${claim.id}`}
                          </span>
                          <div className="flex items-center gap-2 text-[11px] text-slate-400 dark:text-slate-500 font-medium mt-1">
                            <span>{claim.report_number || `EXP-CLM-${claim.id}`}</span>
                            <span>•</span>
                            <span>{formatDate(claim.submitted_at || claim.created_at || '')}</span>
                          </div>
                          {expensesCount > 0 && (
                            <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-semibold mt-1">
                              {expensesCount} expense{expensesCount > 1 ? 's' : ''} bundled
                            </span>
                          )}
                        </div>

                        {/* Right Amount details & status */}
                        <div className="flex flex-col items-end gap-1.5 shrink-0">
                          <span className={`px-2 py-0.5 rounded-lg text-[9px] font-bold uppercase tracking-wider border ${getClaimStatusColor(status)}`}>
                            {status}
                          </span>
                          <span className="text-sm font-black text-slate-800 dark:text-slate-100">
                            {symbol} {parseFloat(claimAmount.toString() || '0').toFixed(2)}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )
      ) : activeSubmodule === 'advances' ? (
        /* ==================== ADVANCES SUBMODULE ==================== */
        isAdvancesLoading && !showAdvanceForm && advances.length === 0 ? (
          <div className="flex flex-col gap-6 py-8">
            <div className="grid grid-cols-2 gap-4">
              <div className="h-20 bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800/60 animate-pulse" />
              <div className="h-20 bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800/60 animate-pulse" />
            </div>
            <div className="h-4 bg-slate-100 dark:bg-slate-800 rounded w-1/4 animate-pulse mt-4" />
            <div className="h-48 bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800/60 animate-pulse" />
          </div>
        ) : showAdvanceForm ? (
          /* New Advance Request Form */
          <form noValidate onSubmit={handleAdvanceSubmit} className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-100 dark:border-slate-800/60 shadow-sm flex flex-col gap-5">
            {/* Currency & Amount */}
            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-1 flex flex-col gap-2">
                <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Currency <span className="text-red-500">*</span>
                </label>
                <select
                  value={advanceCurrency}
                  onChange={(e) => setAdvanceCurrency(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent dark:text-slate-200"
                >
                  <option value="INR">₹ INR</option>
                  <option value="USD">$ USD</option>
                  <option value="EUR">€ EUR</option>
                </select>
              </div>

              <div className="col-span-2 flex flex-col gap-2">
                <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Amount <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400">
                    {advanceCurrency === 'USD' ? '$' : advanceCurrency === 'EUR' ? '€' : '₹'}
                  </span>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    required
                    value={advanceAmount}
                    onChange={(e) => setAdvanceAmount(e.target.value)}
                    placeholder="e.g. 10000"
                    className="w-full pl-9 pr-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent dark:text-slate-200"
                  />
                </div>
              </div>
            </div>

            {/* Request Date & Apply to Trip */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Request Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  required
                  value={advanceRequestDate}
                  onChange={(e) => setAdvanceRequestDate(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent dark:text-slate-200"
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Apply to Trip <span className="text-slate-400 text-[10px] font-normal">(Optional)</span>
                </label>
                <select
                  value={selectedAdvanceTripId}
                  onChange={(e) => setSelectedAdvanceTripId(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent dark:text-slate-200"
                >
                  <option value="">-- Select Approved Trip --</option>
                  {trips
                    .filter((t) => (t.status || '').toLowerCase() === 'approved')
                    .map((t) => (
                      <option key={t.id} value={t.id.toString()}>
                        {t.trip_name || `Trip #${t.id}`}
                        {t.budget_amount && parseFloat(t.budget_amount.toString()) > 0
                          ? ` [Budget: ₹ ${parseFloat(t.budget_amount.toString()).toFixed(2)}]`
                          : ''}
                      </option>
                    ))}
                </select>
              </div>
            </div>

            {/* Selected Trip Budget Indicator */}
            {selectedAdvanceTripId && (() => {
              const linkedTrip = trips.find((t) => t.id.toString() === selectedAdvanceTripId);
              if (linkedTrip && linkedTrip.budget_amount && parseFloat(linkedTrip.budget_amount.toString()) > 0) {
                return (
                  <div className="p-3 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/40 rounded-2xl text-xs text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
                    <Plane className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>
                      Linked Trip Budget: <strong>₹ {parseFloat(linkedTrip.budget_amount.toString()).toFixed(2)}</strong>
                    </span>
                  </div>
                );
              }
              return null;
            })()}

            {/* Notes / Purpose of Advance */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Notes / Purpose of Advance <span className="text-slate-400 text-[10px] font-normal">(Optional)</span>
                </label>
                <span className="text-[11px] text-slate-400">
                  {advanceNotes.length} / 500
                </span>
              </div>
              <textarea
                rows={3}
                maxLength={500}
                value={advanceNotes}
                onChange={(e) => setAdvanceNotes(e.target.value)}
                placeholder="Describe the purpose or anticipated expenses for this advance request..."
                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent dark:text-slate-200"
              />
            </div>

            {/* Submit Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={isSubmittingAdvance}
                className="w-full py-4 bg-primary hover:bg-primary-hover text-white font-bold rounded-2xl text-xs uppercase tracking-wider active:scale-[0.98] disabled:opacity-50 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-primary/10"
              >
                {isSubmittingAdvance ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Submitting Request...
                  </>
                ) : (
                  <>
                    <Wallet className="w-4 h-4" />
                    Submit Advance Request
                  </>
                )}
              </button>
            </div>
          </form>
        ) : (
          /* Advances List View */
          <div className="flex flex-col gap-6">
            {/* Stats Summary Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-white dark:bg-slate-900 rounded-3xl p-4 border border-slate-100 dark:border-slate-800/60 shadow-sm flex flex-col gap-1">
                <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                  Total Requested
                </span>
                <span className="text-lg font-black text-slate-800 dark:text-slate-100">
                  ₹ {totalAdvancesAmount.toFixed(2)}
                </span>
                <span className="text-[10px] text-slate-400">
                  {totalAdvancesCount} total request{totalAdvancesCount === 1 ? '' : 's'}
                </span>
              </div>

              <div className="bg-white dark:bg-slate-900 rounded-3xl p-4 border border-slate-100 dark:border-slate-800/60 shadow-sm flex flex-col gap-1">
                <span className="text-[10px] font-bold text-amber-500 dark:text-amber-400 uppercase tracking-wider">
                  Pending
                </span>
                <span className="text-lg font-black text-amber-600 dark:text-amber-400">
                  {pendingAdvancesCount}
                </span>
                <span className="text-[10px] text-slate-400">Awaiting approval</span>
              </div>

              <div className="bg-white dark:bg-slate-900 rounded-3xl p-4 border border-slate-100 dark:border-slate-800/60 shadow-sm flex flex-col gap-1">
                <span className="text-[10px] font-bold text-emerald-500 dark:text-emerald-400 uppercase tracking-wider">
                  Approved
                </span>
                <span className="text-lg font-black text-emerald-600 dark:text-emerald-400">
                  {approvedAdvancesCount}
                </span>
                <span className="text-[10px] text-slate-400">Ready for payment</span>
              </div>

              <div className="bg-white dark:bg-slate-900 rounded-3xl p-4 border border-slate-100 dark:border-slate-800/60 shadow-sm flex flex-col gap-1">
                <span className="text-[10px] font-bold text-blue-500 dark:text-blue-400 uppercase tracking-wider">
                  Paid
                </span>
                <span className="text-lg font-black text-blue-600 dark:text-blue-400">
                  {paidAdvancesCount}
                </span>
                <span className="text-[10px] text-slate-400">Disbursed funds</span>
              </div>
            </div>

            {/* Float Action Trigger */}
            <div className="my-1">
              <button
                type="button"
                onClick={handleOpenNewAdvance}
                className="w-full py-4 bg-primary text-white font-bold rounded-2xl text-sm tracking-wider active:scale-[0.98] transition-all cursor-pointer flex items-center justify-center gap-2 shadow-md shadow-primary/10"
              >
                <Plus className="w-5 h-5" />
                <span>New Advance Request</span>
              </button>
            </div>

            {/* Filter Pills */}
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
              {(['all', 'pending', 'approved', 'paid'] as const).map((statusKey) => {
                const isActive = advanceFilterStatus === statusKey;
                const label = statusKey.charAt(0).toUpperCase() + statusKey.slice(1);
                return (
                  <button
                    key={statusKey}
                    type="button"
                    onClick={() => setAdvanceFilterStatus(statusKey)}
                    className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                      isActive
                        ? 'bg-primary text-white shadow-sm shadow-primary/20'
                        : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-100 dark:border-slate-800/60 hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>

            {/* Advances List Cards */}
            <div className="flex flex-col gap-3">
              {filteredAdvances.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-12 bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800/60 shadow-sm text-center">
                  <div className="w-16 h-16 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 text-emerald-500 flex items-center justify-center mb-4">
                    <Wallet className="w-8 h-8" />
                  </div>
                  <h3 className="text-xs font-bold text-slate-600 dark:text-slate-300">
                    No advance requests recorded
                  </h3>
                  <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1 max-w-xs">
                    Request a cash advance or travel allowance before upcoming trips.
                  </p>
                  <button
                    type="button"
                    onClick={handleOpenNewAdvance}
                    className="mt-4 px-4 py-2 bg-primary hover:bg-primary-hover text-white font-bold rounded-xl text-xs transition-colors cursor-pointer"
                  >
                    Create Advance Request
                  </button>
                </div>
              ) : (
                filteredAdvances.map((adv) => {
                  const status = adv.status || 'Pending';
                  const symbol = getAdvanceCurrencySymbol(adv);
                  const amountVal = parseFloat(adv.amount?.toString() || '0');
                  const linkedTripName = adv.trip?.trip_name;

                  return (
                    <div
                      key={adv.id}
                      className="bg-white dark:bg-slate-900 rounded-3xl p-4 border border-slate-100 dark:border-slate-800/60 shadow-sm flex items-center gap-4 transition-transform hover:translate-y-[-1px] duration-150"
                    >
                      {/* Left Avatar */}
                      <div className="w-10 h-10 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-100/50 dark:border-emerald-900/40 shadow-sm">
                        <Wallet className="w-5 h-5" />
                      </div>

                      {/* Details */}
                      <div className="flex-1 flex flex-col min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-extrabold text-slate-800 dark:text-slate-100 truncate">
                            {adv.advance_number || `Advance #${adv.id}`}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 text-[11px] text-slate-400 dark:text-slate-500 font-medium mt-0.5">
                          {adv.request_date && (
                            <span>Requested: {formatDate(adv.request_date)}</span>
                          )}
                          {adv.created_at && !adv.request_date && (
                            <span>{formatDate(adv.created_at)}</span>
                          )}
                        </div>

                        {/* Linked Trip & Notes */}
                        <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                          {linkedTripName && (
                            <span className="px-2 py-0.5 rounded-md text-[9px] font-bold bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-300 border border-sky-100 dark:border-sky-900/40">
                              ✈️ {linkedTripName}
                            </span>
                          )}
                          {adv.notes && (
                            <span className="text-[11px] text-slate-500 dark:text-slate-400 truncate max-w-xs">
                              {adv.notes}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Right Amount details & status */}
                      <div className="flex flex-col items-end gap-1.5 shrink-0">
                        <span className={`px-2 py-0.5 rounded-lg text-[9px] font-bold uppercase tracking-wider border ${getAdvanceStatusColor(status)}`}>
                          {status}
                        </span>
                        <span className="text-sm font-black text-slate-800 dark:text-slate-100">
                          {symbol} {amountVal.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )
      ) : isLoading ? (
        <div className="flex flex-col gap-6 py-8">
          <div className="grid grid-cols-2 gap-4">
            <div className="h-20 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800/60 animate-pulse" />
            <div className="h-20 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800/60 animate-pulse" />
          </div>
          <div className="h-4 bg-slate-100 dark:bg-slate-800 rounded w-1/4 animate-pulse mt-4" />
          <div className="h-48 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800/60 animate-pulse" />
        </div>
      ) : showApplyForm ? (
        
        /* New Expense Form Layout */
        <form noValidate onSubmit={handleApplySubmit} className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-100 dark:border-slate-800/60 shadow-sm flex flex-col gap-5">
          
          {/* Item Name input */}
          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Item Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={itemName}
              onChange={(e) => setItemName(e.target.value)}
              placeholder="e.g. Flight Ticket"
              className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent dark:text-slate-200"
            />
          </div>

          {/* Currency and Amount Fields */}
          <div className="grid grid-cols-3 gap-4">
            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Currency <span className="text-red-500">*</span>
              </label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent dark:text-slate-200"
              >
                <option value="INR">₹ INR</option>
                <option value="USD">$ USD</option>
                <option value="EUR">€ EUR</option>
              </select>
            </div>
            
            <div className="col-span-2 flex flex-col gap-2">
              <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Amount <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                step="0.01"
                required
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="0.00"
                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent dark:text-slate-200"
              />
            </div>
          </div>

          {/* Project Select */}
          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Project {isProjectMandatory && <span className="text-red-500">*</span>}
            </label>
            <select
              value={selectedProjectId}
              onChange={(e) => setSelectedProjectId(e.target.value)}
              required={isProjectMandatory}
              className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent dark:text-slate-200"
            >
              <option value="">{isProjectMandatory ? 'Select Project' : 'Select Project (Optional)'}</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.project_name}
                </option>
              ))}
            </select>
          </div>

          {/* Category Select */}
          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Category <span className="text-red-500">*</span>
            </label>
            <select
              value={selectedCategoryId}
              onChange={(e) => setSelectedCategoryId(e.target.value)}
              className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent dark:text-slate-200"
            >
              <option value="">Select category</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.category_name}
                </option>
              ))}
            </select>
          </div>

          {/* Purchase Date picker */}
          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Purchase Date <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              required
              value={ensureISODate(purchaseDate)}
              onChange={(e) => setPurchaseDate(e.target.value)}
              className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent dark:text-slate-200"
            />
          </div>

          {/* Vendor/Purchased From input */}
          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Vendor (Purchased From)
            </label>
            <input
              type="text"
              value={purchasedFrom}
              onChange={(e) => setPurchasedFrom(e.target.value)}
              placeholder="Where did you buy it?"
              className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent dark:text-slate-200"
            />
          </div>

          {/* Custom Fields */}
          {customFields.map((field) => {
            const fieldKey = `field_${field.id}`;
            const isRequired = field.required === 'yes';
            let options: string[] = [];
            if (field.values) {
              try {
                options = typeof field.values === 'string' ? JSON.parse(field.values) : field.values;
              } catch (e) {
                options = typeof field.values === 'string' ? field.values.split(',') : [];
              }
            }

            return (
              <div key={field.id} className="flex flex-col gap-2">
                <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  {field.label} {isRequired && <span className="text-red-500">*</span>}
                </label>
                {field.type === 'textarea' ? (
                  <textarea
                    required={isRequired}
                    value={customFieldsValues[fieldKey] || ''}
                    onChange={(e) => setCustomFieldsValues({ ...customFieldsValues, [fieldKey]: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent dark:text-slate-200"
                    rows={3}
                  />
                ) : field.type === 'select' ? (
                  <select
                    required={isRequired}
                    value={customFieldsValues[fieldKey] || ''}
                    onChange={(e) => setCustomFieldsValues({ ...customFieldsValues, [fieldKey]: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent dark:text-slate-200"
                  >
                    <option value="">Select {field.label.toLowerCase()}</option>
                    {options.map((opt, i) => (
                      <option key={i} value={opt}>{opt}</option>
                    ))}
                  </select>
                ) : field.type === 'radio' ? (
                  <div className="flex flex-wrap gap-4 mt-1">
                    {options.map((opt, i) => (
                      <label key={i} className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-350 cursor-pointer">
                        <input
                          type="radio"
                          name={fieldKey}
                          required={isRequired}
                          checked={customFieldsValues[fieldKey] === opt}
                          onChange={() => setCustomFieldsValues({ ...customFieldsValues, [fieldKey]: opt })}
                          className="text-primary focus:ring-primary focus:ring-2 border-slate-300"
                        />
                        <span>{opt}</span>
                      </label>
                    ))}
                  </div>
                ) : field.type === 'checkbox' ? (
                  <div className="flex flex-wrap gap-4 mt-1">
                    {options.map((opt, i) => {
                      const currentVal = Array.isArray(customFieldsValues[fieldKey]) ? customFieldsValues[fieldKey] : [];
                      return (
                        <label key={i} className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-350 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={currentVal.includes(opt)}
                            onChange={(e) => {
                              const newVal = e.target.checked
                                ? [...currentVal, opt]
                                : currentVal.filter((v: any) => v !== opt);
                              setCustomFieldsValues({ ...customFieldsValues, [fieldKey]: newVal });
                            }}
                            className="text-primary focus:ring-primary focus:ring-2 border-slate-300 rounded"
                          />
                          <span>{opt}</span>
                        </label>
                      );
                    })}
                  </div>
                ) : field.type === 'date' ? (
                  <input
                    type="date"
                    required={isRequired}
                    value={ensureISODate(customFieldsValues[fieldKey] || '')}
                    onChange={(e) => setCustomFieldsValues({ ...customFieldsValues, [fieldKey]: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent dark:text-slate-200"
                  />
                ) : field.type === 'file' ? (
                  <div className="flex flex-col gap-2">
                    <input
                      type="file"
                      id={`file-${field.id}`}
                      accept="image/*,application/pdf"
                      className="hidden"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const processed = await compressImageIfNeeded(file);
                          setCustomFieldsValues({ ...customFieldsValues, [fieldKey]: processed });
                        }
                      }}
                    />
                    <div 
                      onClick={() => document.getElementById(`file-${field.id}`)?.click()}
                      className="border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl p-6 flex flex-col items-center justify-center gap-2 cursor-pointer hover:bg-slate-50/50 dark:hover:bg-slate-950/20 hover:border-primary/50 transition-all text-center"
                    >
                      <div className="w-10 h-10 rounded-full bg-primary-light dark:bg-slate-800 flex items-center justify-center text-primary">
                        <Upload className="w-5 h-5" />
                      </div>
                      <span className="text-xs font-bold text-slate-700 dark:text-slate-200">
                        {customFieldsValues[fieldKey] ? 'Change File' : 'Attach File'}
                      </span>
                      <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">
                        {customFieldsValues[fieldKey] ? customFieldsValues[fieldKey].name : 'Upload JPEG, PNG or PDF (Max 5MB)'}
                      </span>
                    </div>
                    
                    {customFieldsValues[fieldKey] && (
                      <div className="flex items-center justify-between p-2 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-100 dark:border-slate-800 text-xs font-semibold text-slate-600 dark:text-slate-350">
                        <span className="truncate max-w-[85%]">{customFieldsValues[fieldKey].name}</span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            const newVals = { ...customFieldsValues };
                            delete newVals[fieldKey];
                            setCustomFieldsValues(newVals);
                            const inp = document.getElementById(`file-${field.id}`) as HTMLInputElement;
                            if (inp) inp.value = '';
                          }}
                          className="text-red-500 hover:text-red-750 cursor-pointer"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <input
                    type={field.type === 'number' ? 'number' : 'text'}
                    required={isRequired}
                    value={customFieldsValues[fieldKey] || ''}
                    onChange={(e) => setCustomFieldsValues({ ...customFieldsValues, [fieldKey]: e.target.value })}
                    placeholder={`Enter ${field.label.toLowerCase()}`}
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent dark:text-slate-200"
                  />
                )}
              </div>
            );
          })}

          {/* Receipt File upload block */}
          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Receipt Attachment {isBillMandatory && <span className="text-red-500">*</span>}
            </label>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/*,application/pdf"
              className="hidden"
            />

            <div 
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl p-6 flex flex-col items-center justify-center gap-2 cursor-pointer hover:bg-slate-50/50 dark:hover:bg-slate-950/20 hover:border-primary/50 transition-all text-center"
            >
              <div className="w-10 h-10 rounded-full bg-primary-light dark:bg-slate-800 flex items-center justify-center text-primary">
                <Upload className="w-5 h-5" />
              </div>
              <span className="text-xs font-bold text-slate-700 dark:text-slate-200">
                {receiptFile ? 'Change Receipt' : 'Attach Receipt'}
              </span>
              <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">
                {receiptFile ? receiptFile.name : 'Upload JPEG, PNG or PDF (Max 5MB)'}
              </span>
            </div>
            
            {receiptFile && (
              <div className="flex items-center justify-between p-2 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-100 dark:border-slate-800 text-xs font-semibold text-slate-600 dark:text-slate-350">
                <span className="truncate max-w-[85%]">{receiptFile.name}</span>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setReceiptFile(null);
                    if (fileInputRef.current) fileInputRef.current.value = '';
                  }}
                  className="text-red-500 hover:text-red-750 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-4 bg-primary hover:bg-primary-hover text-white font-bold rounded-2xl text-sm tracking-wider active:scale-[0.98] disabled:opacity-50 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-primary/10 mt-2"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4.5 h-4.5 animate-spin" />
                SUBMITTING CLAIM...
              </>
            ) : (
              'Submit Claim'
            )}
          </button>

        </form>

      ) : (
        
        /* Main Expense Dashboard layout */
        <div className="flex flex-col gap-8">
          
          {/* Stats Boxes */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-100 dark:border-slate-800/60 shadow-sm flex flex-col gap-1 transition-all hover:translate-y-[-1px]">
              <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                Pending
              </span>
              <span className="text-2xl font-black text-amber-500">
                {pendingCount}
              </span>
            </div>
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-100 dark:border-slate-800/60 shadow-sm flex flex-col gap-1 transition-all hover:translate-y-[-1px]">
              <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                Total Claims
              </span>
              <span className="text-2xl font-black text-primary dark:text-slate-200">
                {totalClaims}
              </span>
            </div>
          </div>

          {/* Float Action Trigger */}
          <div className="my-2">
            <button
              type="button"
              onClick={handleOpenApply}
              className="w-full py-4 bg-primary text-white font-bold rounded-2xl text-sm tracking-wider active:scale-[0.98] transition-all cursor-pointer flex items-center justify-center gap-2 shadow-md shadow-primary/10"
            >
              <Plus className="w-5 h-5" />
              <span>New Expense Claim</span>
            </button>
          </div>

          {/* Expense History List */}
          <div className="flex flex-col gap-3">
            <h3 className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider px-1">
              Expense Claims History
            </h3>

            {expenses.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-slate-400 bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800/60 shadow-sm">
                <FileText className="w-10 h-10 stroke-[1.5] text-slate-350 dark:text-slate-700" />
                <h3 className="text-xs font-bold text-slate-500 mt-2">No expenses recorded</h3>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {expenses.map((expense) => {
                  const status = expense.status || 'Pending';
                  const symbol = getCurrencySymbol(expense);

                  return (
                    <div
                      key={expense.id}
                      className="bg-white dark:bg-slate-900 rounded-3xl p-4 border border-slate-100 dark:border-slate-800/60 shadow-sm flex items-center gap-4 transition-transform hover:translate-y-[-1px] duration-150"
                    >
                      {/* Left Receipt avatar wrapper */}
                      <div className="w-10 h-10 rounded-full bg-primary-light/40 dark:bg-slate-800/80 text-primary dark:text-slate-350 flex items-center justify-center shrink-0 border border-slate-50 dark:border-slate-800 shadow-sm">
                        <Receipt className="w-5 h-5" />
                      </div>

                      {/* Item Details */}
                      <div className="flex-1 flex flex-col min-w-0">
                        <span className="text-sm font-extrabold text-slate-800 dark:text-slate-200 truncate">
                          {expense.item_name || 'Expense'}
                        </span>
                        <span className="text-[11px] text-slate-400 dark:text-slate-500 font-medium mt-1">
                          {formatDate(expense.purchase_date)}
                        </span>
                        {Array.isArray(expense.custom_fields) && expense.custom_fields.map((f: any) => {
                          const fKey = `field_${f.id}`;
                          const val = expense.custom_fields_data ? expense.custom_fields_data[fKey] : null;
                          if (val) {
                            return (
                              <span key={f.id} className="text-[10px] text-slate-500 dark:text-slate-450 mt-1 font-semibold">
                                {f.label}: <span className="font-extrabold text-slate-600 dark:text-slate-350">{Array.isArray(val) ? val.join(', ') : val}</span>
                              </span>
                            );
                          }
                          return null;
                        })}
                      </div>

                      {/* Right Amount details & status */}
                      <div className="flex flex-col items-end gap-1.5 shrink-0">
                        <span className={`px-2 py-0.5 rounded-lg text-[9px] font-bold uppercase tracking-wider border ${getStatusColor(status)}`}>
                          {status}
                        </span>
                        <span className="text-sm font-black text-slate-800 dark:text-slate-100">
                          {symbol} {parseFloat(expense.price || '0').toFixed(2)}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>



        </div>
      )}

    </div>
  );
}
