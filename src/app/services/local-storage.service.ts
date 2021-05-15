import { Inject, Injectable } from '@angular/core';
import {
  LOCAL_STORAGE,
  StorageService,
  StorageTranscoders,
} from 'ngx-webstorage-service';
import { Favorite } from '../models/favorites';
import { BehaviorSubject } from 'rxjs';

const STORAGE_KEY = 'moonswap';
const SAVED_PAIRS = 'savedPairsV0.1';

@Injectable({
  providedIn: 'root',
})
export class LocalStorageService {
  isDarkMode$ = new BehaviorSubject(true);
  theme = 'dark';

  constructor(@Inject(LOCAL_STORAGE) private storage: StorageService) {
    this.isDarkMode$.subscribe((isDark) => {
      if (isDark) {
        this.theme = 'dark';
      } else {
        this.theme = 'light';
      }
    });
  }

  public getSavedPairs(): Favorite[] {
    return (
      this.storage.get<Favorite[]>(SAVED_PAIRS, StorageTranscoders.JSON) || []
    );
  }

  public setSavedPairs(fav: Favorite[]) {
    return this.storage.set(SAVED_PAIRS, fav);
  }

  public savePair(fav: Favorite) {
    const savedPairs = this.getSavedPairs();
    return this.storage.set(SAVED_PAIRS, { ...savedPairs, fav });
  }

  public setDarkMode(bool: boolean) {
    this.isDarkMode$.next(bool);
  }
}
