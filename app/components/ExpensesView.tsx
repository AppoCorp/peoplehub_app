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
  MapPin
} from 'lucide-react';
import { UserSession } from '../services/api';
import ApiService, { ExpenseRecord, ExpenseCategory, ExpenseProject, ExpenseClaimRecord, TripRecord } from '../services/api';

interface ExpensesViewProps {
  session: UserSession;
  onBackToDashboard?: () => void;
}

export default function ExpensesView({ session, onBackToDashboard }: ExpensesViewProps) {
  const [activeSubmodule, setActiveSubmodule] = useState<'launcher' | 'expenses' | 'claims' | 'trips'>('launcher');
  const [hasLoadedExpenses, setHasLoadedExpenses] = useState(false);
  const [expenses, setExpenses] = useState<ExpenseRecord[]>([]);
  const [categories, setCategories] = useState<ExpenseCategory[]>([]);
  const [projects, setProjects] = useState<ExpenseProject[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showApplyForm, setShowApplyForm] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

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

  // Optional Flight & Hotel sections
  const [includeFlight, setIncludeFlight] = useState(false);
  const [flightTripType, setFlightTripType] = useState('one_way');
  const [departFrom, setDepartFrom] = useState('');
  const [arriveAt, setArriveAt] = useState('');
  const [departureDate, setDepartureDate] = useState('');
  const [flightClass, setFlightClass] = useState('economy');
  const [timePreference, setTimePreference] = useState('');
  const [flightDescription, setFlightDescription] = useState('');

  const [includeHotel, setIncludeHotel] = useState(false);
  const [hotelCity, setHotelCity] = useState('');
  const [hotelName, setHotelName] = useState('');
  const [checkInDate, setCheckInDate] = useState('');
  const [checkOutDate, setCheckOutDate] = useState('');
  const [roomType, setRoomType] = useState('single');
  const [hotelDescription, setHotelDescription] = useState('');

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
      if (showTripForm) {
        setShowTripForm(false);
      } else if (showClaimForm) {
        setShowClaimForm(false);
      } else if (showApplyForm) {
        setShowApplyForm(false);
      } else if (activeSubmodule === 'trips' || activeSubmodule === 'claims' || activeSubmodule === 'expenses') {
        setActiveSubmodule('launcher');
      }
    };

    window.addEventListener('popstate', handleSubPopState);
    return () => window.removeEventListener('popstate', handleSubPopState);
  }, [showTripForm, showClaimForm, showApplyForm, activeSubmodule]);

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
      };

      if (includeFlight) {
        payload.depart_from = departFrom.trim();
        payload.arrive_at = arriveAt.trim();
        payload.departure_date = departureDate;
        payload.flight_trip_type = flightTripType;
        payload.flight_class = flightClass;
        payload.time_preference = timePreference || undefined;
        payload.flight_description = flightDescription.trim() || undefined;
      }

      if (includeHotel) {
        payload.hotel_city = hotelCity.trim();
        payload.hotel_name = hotelName.trim() || undefined;
        payload.check_in_date = checkInDate;
        payload.check_out_date = checkOutDate;
        payload.room_type = roomType;
        payload.hotel_description = hotelDescription.trim() || undefined;
      }

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
      setIncludeFlight(false);
      setDepartFrom('');
      setArriveAt('');
      setDepartureDate('');
      setFlightDescription('');
      setIncludeHotel(false);
      setHotelCity('');
      setHotelName('');
      setCheckInDate('');
      setCheckOutDate('');
      setHotelDescription('');

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

  // Stats calculation
  const pendingCount = expenses.filter((e) => e.status?.toLowerCase() === 'pending').length;
  const totalClaims = expenses.length;

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
      <div className="flex items-center gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
        <button
          type="button"
          onClick={() => {
            if (activeSubmodule === 'launcher') {
              if (onBackToDashboard) onBackToDashboard();
            } else if (activeSubmodule === 'trips') {
              handleBackFromTrips();
            } else if (activeSubmodule === 'claims') {
              handleBackFromClaims();
            } else {
              handleBackFromExpenses();
            }
          }}
          className="w-9 h-9 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-350 cursor-pointer active:scale-95 transition-transform"
        >
          <ArrowLeft className="w-4.5 h-4.5" />
        </button>

        <div>
          <h2 className="text-xl md:text-2xl font-bold text-slate-800 dark:text-slate-100">
            {activeSubmodule === 'launcher' 
              ? 'Expenses & Travel' 
              : activeSubmodule === 'trips'
                ? (showTripForm ? 'New Trip Request' : 'Trips')
                : activeSubmodule === 'claims'
                  ? (showClaimForm ? 'New Expense Claim' : 'Expense Claims')
                  : (showApplyForm ? 'Add Expense' 
                  : 'Expenses')}
          </h2>
          {activeSubmodule !== 'launcher' && (
            <p className="text-xs text-slate-400 dark:text-slate-500 font-semibold mt-0.5">
              {activeSubmodule === 'trips'
                ? (showTripForm ? 'Create travel request with flight & hotel preferences' : 'Track and manage your travel requests')
                : activeSubmodule === 'claims'
                  ? (showClaimForm ? 'Bundle expenses & submit reimbursement claim' : 'Track and manage your claims history')
                  : (showApplyForm ? 'Upload your receipt to submit' : 'Track and manage your claims history')}
            </p>
          )}
        </div>
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

            {/* 3. Advances (UI only for now) */}
            <div
              className="w-full flex items-center justify-between p-4 bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800/60 hover:border-slate-200 dark:hover:border-slate-700 transition-all cursor-pointer group"
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
            </div>

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

            {/* Optional Flight Details Section */}
            <div className="border border-slate-100 dark:border-slate-800 rounded-2xl p-4 flex flex-col gap-3 bg-slate-50/50 dark:bg-slate-950/40">
              <label className="flex items-center justify-between cursor-pointer">
                <div className="flex items-center gap-2.5">
                  <Plane className="w-4 h-4 text-sky-500" />
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                    Flight Booking Details
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={includeFlight}
                  onChange={(e) => setIncludeFlight(e.target.checked)}
                  className="w-4 h-4 rounded text-sky-600 focus:ring-sky-500 border-slate-300 dark:border-slate-700"
                />
              </label>

              {includeFlight && (
                <div className="flex flex-col gap-3.5 pt-2 border-t border-slate-200/60 dark:border-slate-800 animate-in fade-in duration-200">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400">Flight Type</label>
                      <select
                        value={flightTripType}
                        onChange={(e) => setFlightTripType(e.target.value)}
                        className="w-full px-3 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs dark:text-slate-200"
                      >
                        <option value="one_way">One Way</option>
                        <option value="round_trip">Round Trip</option>
                      </select>
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400">Class</label>
                      <select
                        value={flightClass}
                        onChange={(e) => setFlightClass(e.target.value)}
                        className="w-full px-3 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs dark:text-slate-200"
                      >
                        <option value="economy">Economy</option>
                        <option value="premium_economy">Premium Economy</option>
                        <option value="business">Business</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400">From (City / Airport)</label>
                      <input
                        type="text"
                        value={departFrom}
                        onChange={(e) => setDepartFrom(e.target.value)}
                        placeholder="e.g. Mumbai (BOM)"
                        className="w-full px-3 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs dark:text-slate-200"
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400">To (City / Airport)</label>
                      <input
                        type="text"
                        value={arriveAt}
                        onChange={(e) => setArriveAt(e.target.value)}
                        placeholder="e.g. London (LHR)"
                        className="w-full px-3 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs dark:text-slate-200"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400">Departure Date</label>
                      <input
                        type="date"
                        value={departureDate}
                        onChange={(e) => setDepartureDate(e.target.value)}
                        className="w-full px-3 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs dark:text-slate-200"
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400">Time Preference</label>
                      <select
                        value={timePreference}
                        onChange={(e) => setTimePreference(e.target.value)}
                        className="w-full px-3 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs dark:text-slate-200"
                      >
                        <option value="">Any Time</option>
                        <option value="morning">Morning (6 AM - 12 PM)</option>
                        <option value="afternoon">Afternoon (12 PM - 6 PM)</option>
                        <option value="evening">Evening (6 PM - 11 PM)</option>
                        <option value="night">Night (11 PM - 6 AM)</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400">Flight Notes / Airline Preference</label>
                    <input
                      type="text"
                      value={flightDescription}
                      onChange={(e) => setFlightDescription(e.target.value)}
                      placeholder="e.g. Non-stop flight preferred, Indigo / Air India"
                      className="w-full px-3 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs dark:text-slate-200"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Optional Hotel Details Section */}
            <div className="border border-slate-100 dark:border-slate-800 rounded-2xl p-4 flex flex-col gap-3 bg-slate-50/50 dark:bg-slate-950/40">
              <label className="flex items-center justify-between cursor-pointer">
                <div className="flex items-center gap-2.5">
                  <Building2 className="w-4 h-4 text-emerald-500" />
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                    Hotel Booking Details
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={includeHotel}
                  onChange={(e) => setIncludeHotel(e.target.checked)}
                  className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-slate-300 dark:border-slate-700"
                />
              </label>

              {includeHotel && (
                <div className="flex flex-col gap-3.5 pt-2 border-t border-slate-200/60 dark:border-slate-800 animate-in fade-in duration-200">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400">City</label>
                      <input
                        type="text"
                        value={hotelCity}
                        onChange={(e) => setHotelCity(e.target.value)}
                        placeholder="e.g. Bengaluru"
                        className="w-full px-3 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs dark:text-slate-200"
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400">Preferred Hotel</label>
                      <input
                        type="text"
                        value={hotelName}
                        onChange={(e) => setHotelName(e.target.value)}
                        placeholder="e.g. Marriott / Taj"
                        className="w-full px-3 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs dark:text-slate-200"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400">Check-in Date</label>
                      <input
                        type="date"
                        value={checkInDate}
                        onChange={(e) => setCheckInDate(e.target.value)}
                        className="w-full px-3 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs dark:text-slate-200"
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400">Check-out Date</label>
                      <input
                        type="date"
                        value={checkOutDate}
                        onChange={(e) => setCheckOutDate(e.target.value)}
                        className="w-full px-3 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs dark:text-slate-200"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400">Room Type</label>
                      <select
                        value={roomType}
                        onChange={(e) => setRoomType(e.target.value)}
                        className="w-full px-3 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs dark:text-slate-200"
                      >
                        <option value="single">Single Room</option>
                        <option value="double">Double Room</option>
                        <option value="deluxe">Deluxe / Suite</option>
                      </select>
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400">Hotel Notes</label>
                      <input
                        type="text"
                        value={hotelDescription}
                        onChange={(e) => setHotelDescription(e.target.value)}
                        placeholder="e.g. Near office location"
                        className="w-full px-3 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs dark:text-slate-200"
                      />
                    </div>
                  </div>
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
                    const status = trip.status || 'Pending';
                    const isIntl = trip.travel_type === 'international';
                    const flightsCount = trip.flights?.length || 0;
                    const hotelsCount = trip.hotels?.length || 0;

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
                            <span className="capitalize">{trip.travel_type || 'Domestic'}</span>
                            {trip.created_at && (
                              <>
                                <span>•</span>
                                <span>{formatDate(trip.created_at)}</span>
                              </>
                            )}
                          </div>

                          <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                            {isIntl && trip.destination_country && (
                              <span className="px-2 py-0.5 rounded-md text-[9px] font-bold bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-300 border border-sky-100 dark:border-sky-900/40">
                                📍 {trip.destination_country}
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
                            {trip.duration && (
                              <span className="px-2 py-0.5 rounded-md text-[9px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                                ⏱️ {trip.duration}
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
