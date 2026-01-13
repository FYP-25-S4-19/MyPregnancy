import { useState, useCallback, useEffect } from 'react';
import { Platform } from 'react-native';
import {
    requestPermission,
    readRecords,
    initialize,
    getGrantedPermissions,
} from 'react-native-health-connect';

export const useHeartRate = () => {
    const [heartRateData, setHeartRateData] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [diagnostics, setDiagnostics] = useState<any>(null);

    const runDiagnostics = useCallback(async () => {
        if (Platform.OS !== 'android') return;

        try {
            await initialize();
            
            // Check all granted permissions
            const grantedPermissions = await getGrantedPermissions();
            console.log('📋 Granted Permissions:', JSON.stringify(grantedPermissions, null, 2));

            // Try reading heart rate with VERY WIDE time filter (last 365 days)
            console.log('🔍 Checking for ANY heart rate data (last 365 days)...');
            try {
                const now = new Date();
                const oneYearAgo = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
                
                const { records: allHR } = await readRecords('HeartRate', {
                    timeRangeFilter: {
                        operator: 'between',
                        startTime: oneYearAgo.toISOString(),
                        endTime: now.toISOString(),
                    },
                });
                console.log('💓 TOTAL Heart Rate records (365 days):', allHR.length);
                if (allHR.length > 0) {
                    console.log('First HR record:', JSON.stringify(allHR[0], null, 2));
                    console.log('Last HR record:', JSON.stringify(allHR[allHR.length - 1], null, 2));
                    setHeartRateData(allHR); // Update the state with found data
                }
            } catch (e: any) {
                console.log('❌ Error reading all heart rate:', e.message);
            }

            // Try to read Steps data as a test
            try {
                const now = new Date();
                const startTime = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
                
                const { records: stepRecords } = await readRecords('Steps', {
                    timeRangeFilter: {
                        operator: 'between',
                        startTime: startTime.toISOString(),
                        endTime: now.toISOString(),
                    },
                });
                console.log('🚶 Steps records (30 days):', stepRecords.length);
            } catch (e) {
                console.log('❌ Could not read Steps data');
            }

            setDiagnostics({ grantedPermissions, tested: true });
        } catch (e) {
            console.error('Diagnostics error:', e);
        }
    }, []);

    const fetchHeartRate = useCallback(async (daysAgo: number = 7) => {
        if (Platform.OS !== 'android') {
            setError('Health Connect is only available on Android.');
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            // 1. Initialize the client
            const isInitialized = await initialize();
            console.log('Health Connect initialized:', isInitialized);
            if (!isInitialized) {
                throw new Error('Health Connect failed to initialize.');
            }

            // 2. Request permissions for HeartRate
            const granted = await requestPermission([
                { accessType: 'read', recordType: 'HeartRate' },
            ]);
            console.log('Permission result:', granted);

            // Check if HeartRate was actually granted
            const hasPermission = granted.some(p => p.recordType === 'HeartRate');
            console.log('Has heart rate permission:', hasPermission);
            if (!hasPermission) {
                throw new Error('Heart Rate permission denied by user.');
            }

            // 3. Define the time window (now using days instead of hours)
            const now = new Date();
            const startTime = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);
            console.log('Fetching heart rate from', startTime.toISOString(), 'to', now.toISOString());
            console.log(`Looking back ${daysAgo} days for heart rate data`);

            // 4. Read the records
            const { records } = await readRecords('HeartRate', {
                timeRangeFilter: {
                    operator: 'between',
                    startTime: startTime.toISOString(),
                    endTime: now.toISOString(),
                },
            });

            console.log('Heart rate records fetched:', records.length, 'records');
            if (records.length > 0) {
                console.log('First record:', JSON.stringify(records[0], null, 2));
                console.log('Last record:', JSON.stringify(records[records.length - 1], null, 2));
            } else {
                console.log('⚠️ No heart rate data found. Check if:');
                console.log('  1. Samsung Health is syncing to Health Connect');
                console.log('  2. Your watch is syncing to Samsung Health');
                console.log('  3. Health Connect has heart rate data permissions');
            }
            setHeartRateData(records);
        } catch (err: any) {
            console.error(err);
            setError(err.message || 'An unknown error occurred');
        } finally {
            setIsLoading(false);
        }
    }, []);

    // Automatically fetch heart rate data on mount
    useEffect(() => {
        fetchHeartRate();
    }, [fetchHeartRate]);

    return { heartRateData, isLoading, error, fetchHeartRate, runDiagnostics, diagnostics };
};