import {
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  writeBatch,
  type Timestamp,
  type Unsubscribe,
} from 'firebase/firestore';
import {
  CAPABILITIES,
  DEFAULT_SITE_CONFIG,
  DESIGN_PROJECTS,
  UGC_REELS,
} from '../data/portfolioData';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import type {
  CapabilityItem,
  CustomSection,
  DesignProject,
  InquiryFormData,
  InquiryStatus,
  ProjectInquiryRecord,
  SiteConfig,
  UgcReel,
} from '../types/portfolio';
import {
  createSlugId,
  sanitizeCapabilityPayload,
  sanitizeCustomSectionPayload,
  sanitizeDesignProjectPayload,
  sanitizeSiteConfig,
  sanitizeUgcReelPayload,
} from '../utils/cmsUtils';

export function subscribeSiteConfig(
  onData: (config: SiteConfig | null) => void,
): Unsubscribe {
  const path = 'site_config/main';
  return onSnapshot(
    doc(db, 'site_config', 'main'),
    (snap) => {
      if (!snap.exists()) {
        onData(null);
        return;
      }
      onData(sanitizeSiteConfig(snap.data() as Partial<SiteConfig>));
    },
    (error) => {
      handleFirestoreError(error, OperationType.GET, path);
    },
  );
}

export function subscribeUgcReels(onData: (reels: UgcReel[] | null) => void): Unsubscribe {
  const path = 'ugc_reels';
  const q = query(collection(db, path), where('sortOrder', '>=', 0), orderBy('sortOrder', 'asc'));
  return onSnapshot(
    q,
    (snap) => {
      if (snap.empty) {
        onData(null);
        return;
      }
      const list: UgcReel[] = snap.docs.map((docSnap) => ({
        id: docSnap.id,
        ...(docSnap.data() as Omit<UgcReel, 'id'>),
      }));
      onData(list);
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
    },
  );
}

export function subscribeDesignProjects(
  onData: (projects: DesignProject[] | null) => void,
): Unsubscribe {
  const path = 'design_projects';
  const q = query(collection(db, path), where('sortOrder', '>=', 0), orderBy('sortOrder', 'asc'));
  return onSnapshot(
    q,
    (snap) => {
      if (snap.empty) {
        onData(null);
        return;
      }
      const list: DesignProject[] = snap.docs.map((docSnap) => ({
        id: docSnap.id,
        ...(docSnap.data() as Omit<DesignProject, 'id'>),
      }));
      onData(list);
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
    },
  );
}

export function subscribeCapabilities(
  onData: (items: CapabilityItem[] | null) => void,
): Unsubscribe {
  const path = 'capabilities';
  const q = query(collection(db, path), where('sortOrder', '>=', 0), orderBy('sortOrder', 'asc'));
  return onSnapshot(
    q,
    (snap) => {
      if (snap.empty) {
        onData(null);
        return;
      }
      const list: CapabilityItem[] = snap.docs.map((docSnap) => ({
        id: docSnap.id,
        ...(docSnap.data() as Omit<CapabilityItem, 'id'>),
      }));
      onData(list);
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
    },
  );
}

export function subscribeCustomSections(
  isAdmin: boolean,
  onData: (sections: CustomSection[]) => void,
): Unsubscribe {
  const path = 'custom_sections';
  const q = isAdmin
    ? query(collection(db, path))
    : query(collection(db, path), where('isVisible', '==', true));

  return onSnapshot(
    q,
    (snap) => {
      const list: CustomSection[] = snap.docs
        .map((docSnap) => ({
          id: docSnap.id,
          ...(docSnap.data() as Omit<CustomSection, 'id'>),
        }))
        .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
      onData(list);
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
    },
  );
}

export function subscribeInquiries(
  onData: (inquiries: ProjectInquiryRecord[]) => void,
): Unsubscribe {
  const path = 'inquiries';
  const q = query(collection(db, path), where('status', 'in', ['new', 'reviewed', 'replied']));
  return onSnapshot(
    q,
    (snap) => {
      const list: ProjectInquiryRecord[] = snap.docs
        .map((docSnap) => {
          const data = docSnap.data() as {
            name: string;
            email: string;
            projectType: ProjectInquiryRecord['projectType'];
            message: string;
            status: InquiryStatus;
            createdAt?: Timestamp;
          };
          return {
            id: docSnap.id,
            name: data.name,
            email: data.email,
            projectType: data.projectType,
            message: data.message,
            status: data.status,
            createdAtMs: data.createdAt?.toMillis?.() ?? Date.now(),
          };
        })
        .sort((a, b) => b.createdAtMs - a.createdAtMs);
      onData(list);
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
    },
  );
}

export async function saveSiteConfig(config: SiteConfig): Promise<void> {
  const path = 'site_config/main';
  const clean = sanitizeSiteConfig(config);
  try {
    await setDoc(doc(db, 'site_config', 'main'), {
      ...clean,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function saveUgcReel(
  reel: Omit<UgcReel, 'id'> & { id?: string },
  sortOrder = 0,
): Promise<string> {
  const id = reel.id || createSlugId('reel', reel.title);
  const path = `ugc_reels/${id}`;
  const clean = sanitizeUgcReelPayload(reel, sortOrder);
  try {
    await setDoc(doc(db, 'ugc_reels', id), {
      ...clean,
      updatedAt: serverTimestamp(),
    });
    return id;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function deleteUgcReel(id: string): Promise<void> {
  const path = `ugc_reels/${id}`;
  try {
    await deleteDoc(doc(db, 'ugc_reels', id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function saveDesignProject(
  project: Omit<DesignProject, 'id'> & { id?: string },
  sortOrder = 0,
): Promise<string> {
  const id = project.id || createSlugId('design', project.title);
  const path = `design_projects/${id}`;
  const clean = sanitizeDesignProjectPayload(project, sortOrder);
  try {
    await setDoc(doc(db, 'design_projects', id), {
      ...clean,
      updatedAt: serverTimestamp(),
    });
    return id;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function deleteDesignProject(id: string): Promise<void> {
  const path = `design_projects/${id}`;
  try {
    await deleteDoc(doc(db, 'design_projects', id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function saveCapability(
  cap: Omit<CapabilityItem, 'id'> & { id?: string },
  sortOrder = 0,
): Promise<string> {
  const id = cap.id || createSlugId('cap', cap.title);
  const path = `capabilities/${id}`;
  const clean = sanitizeCapabilityPayload(cap, sortOrder);
  try {
    await setDoc(doc(db, 'capabilities', id), {
      ...clean,
      updatedAt: serverTimestamp(),
    });
    return id;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function deleteCapability(id: string): Promise<void> {
  const path = `capabilities/${id}`;
  try {
    await deleteDoc(doc(db, 'capabilities', id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function saveCustomSection(
  section: Omit<CustomSection, 'id'> & { id?: string },
  sortOrder = 0,
): Promise<string> {
  const id = section.id || createSlugId('section', section.heading);
  const path = `custom_sections/${id}`;
  const clean = sanitizeCustomSectionPayload(section, sortOrder);
  try {
    await setDoc(doc(db, 'custom_sections', id), {
      ...clean,
      updatedAt: serverTimestamp(),
    });
    return id;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function deleteCustomSection(id: string): Promise<void> {
  const path = `custom_sections/${id}`;
  try {
    await deleteDoc(doc(db, 'custom_sections', id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function submitProjectInquiry(data: InquiryFormData): Promise<string> {
  const id = createSlugId('inq', data.name);
  const path = `inquiries/${id}`;
  try {
    await setDoc(doc(db, 'inquiries', id), {
      name: data.name.trim().slice(0, 120),
      email: data.email.trim().slice(0, 180),
      projectType: data.projectType,
      message: data.message.trim().slice(0, 2000),
      status: 'new',
      createdAt: serverTimestamp(),
    });
    return id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function updateInquiryStatus(id: string, status: InquiryStatus): Promise<void> {
  const path = `inquiries/${id}`;
  try {
    await updateDoc(doc(db, 'inquiries', id), { status });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function deleteInquiry(id: string): Promise<void> {
  const path = `inquiries/${id}`;
  try {
    await deleteDoc(doc(db, 'inquiries', id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

/**
 * Seeds default portfolio collections into Firestore when the admin initializes cloud CMS.
 */
export async function seedDefaultPortfolioToCloud(): Promise<void> {
  const path = 'batch/seed';
  try {
    const batch = writeBatch(db);
    batch.set(doc(db, 'site_config', 'main'), {
      ...sanitizeSiteConfig(DEFAULT_SITE_CONFIG),
      updatedAt: serverTimestamp(),
    });
    UGC_REELS.forEach((reel, idx) => {
      batch.set(doc(db, 'ugc_reels', reel.id), {
        ...sanitizeUgcReelPayload(reel, idx),
        updatedAt: serverTimestamp(),
      });
    });
    DESIGN_PROJECTS.forEach((project, idx) => {
      batch.set(doc(db, 'design_projects', project.id), {
        ...sanitizeDesignProjectPayload(project, idx),
        updatedAt: serverTimestamp(),
      });
    });
    CAPABILITIES.forEach((cap, idx) => {
      const capId = cap.id || `cap-${idx + 1}`;
      batch.set(doc(db, 'capabilities', capId), {
        ...sanitizeCapabilityPayload(cap, idx),
        updatedAt: serverTimestamp(),
      });
    });
    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}
