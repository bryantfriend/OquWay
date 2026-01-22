console.log('Registry module loaded');

import { Registry as SharedRegistry } from '../../Shared/steps/Registry.js';

// Legacy Engines
import { MatchingGameEngine } from '../engines/MatchingGameEngine.js';
import { PrimerEngine } from '../engines/PrimerEngine.js';
import { MissionEngine } from '../engines/MissionEngine.js';
import { ReflectionEngine } from '../engines/ReflectionEngine.js';
import { MovieEngine } from '../engines/MovieEngine.js';
import { DialogueEngine } from '../engines/DialogueEngine.js';
import { RoleplayEngine } from '../engines/RoleplayEngine.js';
import { IntentCheckEngine } from '../engines/IntentCheckEngine.js';
import { LetterRacingGameEngine } from '../engines/LetterRacingGameEngine.js';
// Note: recursive dependency if we import everything? 
// Ideally these engines are default exports from their files.
// We need to ensure these files exist or are imported correctly.
// Based on file list, they exist.

export const Registry = {
  /**
   * Initialize legacy engines
   */
  init(database) {
    // 1. Initialize Cloud Registry (Shared)
    // This starts the fetch of cloud steps
    const initPromise = SharedRegistry.init(database);

    // 2. Register Legacy engines
    // These are physically present in the codebase but maybe not in cloud yet
    // Legacy engines only
    // We assume these classes are available globally or imported. 
    // Since this file originally didn't import them (it relied on them being globals or imported elsewhere?),
    // we should check how they were used.
    // The original code used variables like `MatchingGameEngine` without importing them in the snippet I saw.
    // This implies they are global or formatted in a way that bundling handles.
    // However, to be safe and "module-native", we should try to register what we have.

    // If they are on window, we use them.
    const legacies = [
      window.MultiplicationGame,
      window.MatchingGameEngine,
      PrimerEngine, // Use the imported class directly
      window.MissionEngine,
      window.ReflectionEngine,
      window.MovieEngine,
      window.DialogueEngine,
      window.RoleplayEngine,
      window.IntentCheckEngine,
      window.LetterRacingGameEngine
    ];

    legacies.forEach(Engine => {
      if (Engine) {
        this.registerLegacy(Engine);
      }
    });

    return initPromise;
  },

  /* =====================================================
     LEGACY ENGINE REGISTRATION
  ===================================================== */

  registerLegacy(EngineClass) {
    if (!EngineClass?.id) {
      console.error("[Registry] Legacy engine missing id", EngineClass);
      return;
    }

    // Mark as legacy
    EngineClass.__legacy = true;

    // Check collision
    const existing = SharedRegistry.get(EngineClass.id);
    if (existing) {
      if (existing.isCloud) {
        console.warn(`[Registry] Skipping Legacy Engine '${EngineClass.id}' - Cloud step has priority.`);
        return;
      }
      console.warn(`[Registry] Overwriting existing step '${EngineClass.id}' with Legacy Engine.`);
    }

    SharedRegistry.register(EngineClass);
    console.log(`[Registry] Registered LEGACY engine: ${EngineClass.id}`);
  },

  /* =====================================================
     CLOUD STEP REGISTRATION (Proxy to Shared)
  ===================================================== */

  registerCloud(StepClass, meta = {}) {
    SharedRegistry.registerCloud(StepClass, meta);
  },

  /* =====================================================
     LOOKUPS (Proxy to Shared)
  ===================================================== */

  get(id) {
    return SharedRegistry.get(id);
  },

  getAll() {
    return SharedRegistry.getAll();
  },

  /* =====================================================
     HOT RELOAD (Cloud) (Proxy to Shared)
  ===================================================== */

  async reloadCloudStep(id, code) {
    return SharedRegistry.reloadCloudStep(id, code);
  }
};
