/**
 * Export / import the whole database as a JSON file. Export writes to the cache
 * and opens the share sheet; import picks a file, validates it, then replaces all
 * data. This is the app's only backup path (local-first, no cloud).
 */
import * as DocumentPicker from 'expo-document-picker';
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { useCallback, useState } from 'react';

import { isBackupData, restoreDatabase, serializeDatabase } from '@/db';

export type ImportResult = 'ok' | 'cancelled' | 'invalid' | 'error';

export function useBackup() {
  const [busy, setBusy] = useState(false);

  const exportBackup = useCallback(async (): Promise<boolean> => {
    setBusy(true);
    try {
      const json = JSON.stringify(serializeDatabase(new Date()), null, 2);
      const file = new File(Paths.cache, 'skala-backup.json');
      if (file.exists) file.delete();
      file.create();
      file.write(json);
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(file.uri, {
          mimeType: 'application/json',
          dialogTitle: 'Skala-Backup teilen',
          UTI: 'public.json',
        });
      }
      return true;
    } catch {
      return false;
    } finally {
      setBusy(false);
    }
  }, []);

  const importBackup = useCallback(async (): Promise<ImportResult> => {
    setBusy(true);
    try {
      const result = await DocumentPicker.getDocumentAsync({ copyToCacheDirectory: true });
      if (result.canceled) return 'cancelled';
      const asset = result.assets[0];
      if (!asset) return 'cancelled';
      const text = await new File(asset.uri).text();
      const parsed: unknown = JSON.parse(text);
      if (!isBackupData(parsed)) return 'invalid';
      restoreDatabase(parsed);
      return 'ok';
    } catch {
      return 'error';
    } finally {
      setBusy(false);
    }
  }, []);

  return { busy, exportBackup, importBackup };
}
