'use client';

import { useState, useEffect, useCallback } from 'react';
import ApiService, { UserSession } from '../services/api';

const SESSION_KEY = 'ph_session';

export function useAuth() {
  const [session, setSession] = useState<UserSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refreshCompanySettings = useCallback(async (currentSession?: UserSession | null) => {
    const targetSession = currentSession || session;
    if (!targetSession || !targetSession.token || !targetSession.baseUrl) return;

    try {
      const companyData = await ApiService.getCompany(targetSession.baseUrl, targetSession.token);
      if (companyData) {
        const isExpenseEnabled = companyData.mobile_expense_status !== undefined
          ? (companyData.mobile_expense_status !== false && companyData.mobile_expense_status !== 0 && companyData.mobile_expense_status !== '0')
          : true;
        const isCompOffEnabled = companyData.mobile_comp_off_status !== undefined
          ? (companyData.mobile_comp_off_status !== false && companyData.mobile_comp_off_status !== 0 && companyData.mobile_comp_off_status !== '0')
          : true;
        const isPeopleEnabled = companyData.mobile_people_status !== undefined
          ? (companyData.mobile_people_status !== false && companyData.mobile_people_status !== 0 && companyData.mobile_people_status !== '0')
          : true;

        setSession((prev) => {
          if (!prev) return prev;
          if (
            prev.mobileExpenseEnabled === isExpenseEnabled &&
            prev.mobileCompOffEnabled === isCompOffEnabled &&
            prev.mobilePeopleEnabled === isPeopleEnabled &&
            (!companyData.logo_url || prev.companyLogo === companyData.logo_url)
          ) {
            return prev;
          }
          const updated: UserSession = {
            ...prev,
            mobileExpenseEnabled: isExpenseEnabled,
            mobileCompOffEnabled: isCompOffEnabled,
            mobilePeopleEnabled: isPeopleEnabled,
            companyName: companyData.company_name || prev.companyName,
            companyLogo: companyData.logo_url || prev.companyLogo,
          };
          localStorage.setItem(SESSION_KEY, JSON.stringify(updated));
          return updated;
        });
      }
    } catch (e) {
      console.warn('Failed to refresh company settings:', e);
    }
  }, [session]);

  useEffect(() => {
    // Check if user session exists in localStorage
    if (typeof window !== 'undefined') {
      try {
        const storedSession = localStorage.getItem(SESSION_KEY);
        if (storedSession) {
          const parsed: UserSession = JSON.parse(storedSession);
          setSession(parsed);
          // Immediately check latest company settings from server
          ApiService.getCompany(parsed.baseUrl, parsed.token)
            .then((companyData) => {
              if (companyData) {
                const isExpenseEnabled = companyData.mobile_expense_status !== undefined
                  ? (companyData.mobile_expense_status !== false && companyData.mobile_expense_status !== 0 && companyData.mobile_expense_status !== '0')
                  : true;
                const isCompOffEnabled = companyData.mobile_comp_off_status !== undefined
                  ? (companyData.mobile_comp_off_status !== false && companyData.mobile_comp_off_status !== 0 && companyData.mobile_comp_off_status !== '0')
                  : true;
                const isPeopleEnabled = companyData.mobile_people_status !== undefined
                  ? (companyData.mobile_people_status !== false && companyData.mobile_people_status !== 0 && companyData.mobile_people_status !== '0')
                  : true;

                setSession((prev) => {
                  if (!prev) return prev;
                  const updated: UserSession = {
                    ...prev,
                    mobileExpenseEnabled: isExpenseEnabled,
                    mobileCompOffEnabled: isCompOffEnabled,
                    mobilePeopleEnabled: isPeopleEnabled,
                    companyName: companyData.company_name || prev.companyName,
                    companyLogo: companyData.logo_url || prev.companyLogo,
                  };
                  localStorage.setItem(SESSION_KEY, JSON.stringify(updated));
                  return updated;
                });
              }
            })
            .catch((e) => console.warn('Could not refresh company settings on init:', e));
        }
      } catch (err) {
        console.error('Failed to parse stored session:', err);
      } finally {
        setLoading(false);
      }
    }
  }, []);

  const login = async (url: string, email: string, password: string) => {
    setLoading(true);
    setError(null);
    try {
      const newSession = await ApiService.login(url, email, password);
      localStorage.setItem(SESSION_KEY, JSON.stringify(newSession));
      setSession(newSession);
      return newSession;
    } catch (err: any) {
      const msg = err.message || 'Login failed';
      setError(msg);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem(SESSION_KEY);
    setSession(null);
  };

  return {
    session,
    isAuthenticated: !!session?.token,
    loading,
    error,
    login,
    logout,
    refreshCompanySettings,
  };
}
