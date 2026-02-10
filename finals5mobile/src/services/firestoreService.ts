import { 
  collection, 
  getDocs, 
  addDoc,
  query,
  orderBy,
  where,
  doc,
  updateDoc,
  deleteDoc,
  getDoc,
  setDoc,
  Timestamp
} from "firebase/firestore"
import { db } from '@/firebase/config'
import type { 
  UserData, 
  Panne, 
  Etat, 
  Voiture, 
  UserVoiture, 
  HistoriqueItem 
} from '@/firebase/config'

// Types pour les réponses
interface ServiceResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

// Save token dans firestore
export const saveTokenToFirestore = async (
  userId: string,
  token: string
): Promise<ServiceResponse<void>> => {
  try {
    // Document fixe pour Godot
    const tokenRef = doc(db, "SystemTokens", "godot_device");
    await setDoc(tokenRef, {
      fcmToken: token,
      userId: userId,
      updatedAt: new Date().toISOString(),
      platform: "web"
    }, { merge: true });
    
    console.log("✅ Token sauvegardé dans Firestore");
    return { success: true, message: "Token sauvegardé" };
  } catch (error: any) {
    console.error("❌ Erreur sauvegarde token:", error);
    return { success: false, error: error.message };
  }
};

// ========== USERS ==========

// Créer ou mettre à jour un utilisateur dans la collection users
export const createOrUpdateUser = async (
  userId: string, 
  userData: Partial<UserData>
): Promise<ServiceResponse<void>> => {
  try {
    const userRef = doc(db, "Users", userId)
    await setDoc(userRef, {
      ...userData,
      updatedAt: new Date().toISOString()
    }, { merge: true })
    
    return { success: true, message: "Utilisateur mis à jour" }
  } catch (error: any) {
    console.error("Erreur lors de la création/mise à jour de l'utilisateur:", error)
    return { success: false, error: error.message }
  }
}

// Récupérer un utilisateur
export const getUser = async (userId: string): Promise<ServiceResponse<UserData>> => {
  try {
    const userRef = doc(db, "Users", userId)
    const userSnap = await getDoc(userRef)
    
    if (userSnap.exists()) {
      return { 
        success: true, 
        data: { id: userSnap.id, ...userSnap.data() } as UserData 
      }
    } else {
      return { success: false, error: "Utilisateur non trouvé" }
    }
  } catch (error: any) {
    console.error("Erreur lors de la récupération de l'utilisateur:", error)
    return { success: false, error: error.message }
  }
}

// ========== PANNES ==========

// Récupérer toutes les pannes
export const getPannes = async (): Promise<ServiceResponse<Panne[]>> => {
  try {
    console.log("🚀 DEBUT getPannes()")
    console.log("📁 Tentative d'accès à la collection: 'Pannes'")
    
    const pannesCollection = collection(db, "Pannes")
    console.log("✅ Collection référencée")
    
    const querySnapshot = await getDocs(pannesCollection)
    
    console.log(`📊 Nombre de documents dans la collection: ${querySnapshot.size}`)
    
    // Log chaque document
    querySnapshot.forEach((doc) => {
      console.log(`📄 Document ID: ${doc.id}`)
      console.log(`   Données:`, doc.data())
      console.log(`   Champs disponibles:`, Object.keys(doc.data()))
    })
    
    const pannes: Panne[] = []
    querySnapshot.forEach((doc) => {
      const data = doc.data()
      pannes.push({
        id: doc.id,
        nom: data.nom || "Nom non défini"
      })
    })
    
    console.log("✅ Pannes formatées:", pannes)
    console.log("🏁 FIN getPannes()")
    
    return { success: true, data: pannes }
  } catch (error: any) {
    console.error("❌ ERREUR dans getPannes():", error)
    console.error("   Message:", error.message)
    console.error("   Code:", error.code)
    console.error("   Stack:", error.stack)
    
    return { 
      success: false, 
      error: `Erreur: ${error.message} (code: ${error.code})` 
    }
  }
}

// ========== ETATS ==========

// Récupérer tous les états
export const getEtats = async (): Promise<ServiceResponse<Etat[]>> => {
  try {
    console.log("🔍 DEBUT getEtats() - Recherche collection 'Etat'")
    
    const etatsCollection = collection(db, "Etat")
    console.log("✅ Collection 'Etat' référencée")
    
    const querySnapshot = await getDocs(etatsCollection)
    
    console.log(`📊 Nombre de documents dans Etat: ${querySnapshot.size}`)
    
    // Log chaque document pour voir sa structure
    querySnapshot.forEach((doc) => {
      console.log(`📄 Document ${doc.id}:`, doc.data())
      console.log(`   Champs disponibles:`, Object.keys(doc.data()))
    })
    
    const etats: Etat[] = []
    querySnapshot.forEach((doc) => {
      const data = doc.data()
      etats.push({
        id: doc.id,
        nom: data.nom || data.non || "Nom non défini",
        ordre: data.ordre || 0
      })
    })
    
    console.log("✅ États formatés:", etats)
    console.log("🏁 FIN getEtats()")
    
    return { success: true, data: etats }
  } catch (error: any) {
    console.error("❌ ERREUR dans getEtats():", error)
    console.error("   Message:", error.message)
    console.error("   Code:", error.code)
    return { success: false, error: error.message }
  }
}

// Récupérer l'état initial (premier état)
export const getEtatInitial = async (): Promise<ServiceResponse<Etat>> => {
  try {
    console.log("🔍 DEBUT getEtatInitial()")
    
    const etatsCollection = collection(db, "Etat")
    const querySnapshot = await getDocs(etatsCollection)
    
    console.log(`📊 Documents trouvés: ${querySnapshot.size}`)
    
    const etats: Etat[] = []
    querySnapshot.forEach((doc) => {
      const data = doc.data()
      etats.push({
        id: doc.id,
        nom: data.nom || data.non || "Nom non défini",
        ordre: data.ordre || 0
      })
    })
    
    // Trier par ordre si le champ existe
    if (etats.every(e => e.ordre !== undefined)) {
      etats.sort((a, b) => (a.ordre || 0) - (b.ordre || 0))
    }
    
    console.log("📋 États triés:", etats)
    
    if (etats.length > 0) {
      console.log(`✅ État initial trouvé: ${etats[0].nom} (ID: ${etats[0].id})`)
      return { success: true, data: etats[0] }
    } else {
      console.log("⚠️ Aucun état trouvé dans la collection")
      return { success: false, error: "Aucun état trouvé dans la collection Etat" }
    }
  } catch (error: any) {
    console.error("❌ ERREUR dans getEtatInitial():", error)
    return { success: false, error: error.message }
  }
}

// Fonction pour vérifier et corriger la structure des états
export const verifierEtCorrigerEtats = async (): Promise<ServiceResponse<void>> => {
  try {
    console.log("🔍 Vérification de la collection Etat...")
    
    const etatsCollection = collection(db, "Etat")
    const snapshot = await getDocs(etatsCollection)
    
    console.log(`📊 ${snapshot.size} documents dans Etat`)
    
    let modifications = 0
    
    // Liste des états requis pour votre application
    const etatsRequis = [
      { nom: "En attente", ordre: 1 },
      { nom: "En réparation", ordre: 2 },
      { nom: "Terminé", ordre: 3 },
      { nom: "Payé", ordre: 4 }
    ]
    
    // Créer les états manquants
    for (const etatRequis of etatsRequis) {
      const existeDeja = snapshot.docs.some(doc => {
        const data = doc.data()
        const nom = data.nom || data.non
        return nom === etatRequis.nom
      })
      
      if (!existeDeja) {
        console.log(`➕ Création de l'état: ${etatRequis.nom}`)
        await addDoc(etatsCollection, {
          nom: etatRequis.nom,
          ordre: etatRequis.ordre,
          createdAt: new Date().toISOString()
        })
        modifications++
      }
    }
    
    if (modifications > 0) {
      console.log(`✅ ${modifications} états créés/modifiés`)
    } else {
      console.log("✅ Structure des états correcte")
    }
    
    return { success: true, message: `Vérification terminée: ${modifications} modifications` }
    
  } catch (error: any) {
    console.error("❌ Erreur vérification états:", error)
    return { success: false, error: error.message }
  }
}

// ========== VOITURES ==========

// Ajouter une voiture à la collection voitures
export const addVoiture = async (voitureData: Omit<Voiture, 'id'>): Promise<ServiceResponse<Voiture>> => {
  try {
    const voituresCollection = collection(db, "Voitures")
    const docRef = await addDoc(voituresCollection, {
      ...voitureData,
      createdAt: new Date().toISOString()
    })
    
    const nouvelleVoiture: Voiture = {
      id: docRef.id,
      ...voitureData
    }
    
    return { 
      success: true, 
      message: "Voiture ajoutée",
      data: nouvelleVoiture
    }
  } catch (error: any) {
    console.error("Erreur lors de l'ajout de la voiture:", error)
    return { success: false, error: error.message }
  }
}

export const addPanneToVoiture = async (
  voitureId: string,
  panneId: string,
  panneNom: string
): Promise<ServiceResponse<void>> => {
  try {
    // Référence à la sous-collection pannes
    const pannesCollectionRef = collection(
      db, 
      "Voitures", 
      voitureId, 
      "pannes"
    );
    
    // Vérifier si la panne existe déjà
    const querySnapshot = await getDocs(
      query(pannesCollectionRef, where("panneId", "==", panneId))
    );
    
    if (querySnapshot.empty) {
      // Ajouter la panne
      await addDoc(pannesCollectionRef, {
        panneId: panneId,
        nom: panneNom,
        addedAt: new Date().toISOString()
      });
    }
    
    return { success: true, message: "Panne ajoutée à la voiture" };
  } catch (error: any) {
    console.error("Erreur lors de l'ajout de la panne:", error);
    return { success: false, error: error.message };
  }
};

// Fonction pour récupérer les pannes d'une voiture
export const getPannesFromVoiture = async (
  voitureId: string
): Promise<ServiceResponse<any[]>> => {
  try {
    const pannesCollectionRef = collection(
      db, 
      "Voitures", 
      voitureId, 
      "pannes"
    );
    
    const querySnapshot = await getDocs(pannesCollectionRef);
    const pannes = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    return { 
      success: true, 
      data: pannes 
    };
  } catch (error: any) {
    console.error("Erreur lors de la récupération des pannes:", error);
    return { success: false, error: error.message };
  }
};

// Récupérer une voiture par ID
export const getVoitureById = async (
  voitureId: string
): Promise<ServiceResponse<Voiture>> => {
  try {
    const voitureDocRef = doc(db, "Voitures", voitureId)
    const voitureDocSnap = await getDoc(voitureDocRef)
    
    if (!voitureDocSnap.exists()) {
      return { 
        success: false, 
        error: "Voiture non trouvée" 
      }
    }
    
    const voitureData = voitureDocSnap.data() as Voiture
    const voiture: Voiture = {
      id: voitureDocSnap.id,
      modele: voitureData.modele,
      typeVehicule: voitureData.typeVehicule || 'particulier',
      createdAt: voitureData.createdAt
    }
    
    return { 
      success: true, 
      data: voiture 
    }
  } catch (error: any) {
    console.error("Erreur lors de la récupération de la voiture:", error)
    return { success: false, error: error.message }
  }
}

// ========== USER VOITURES ==========

// Ajouter une voiture à l'utilisateur
export const addVoitureToUser = async (
  userId: string, 
  voitureId: string, 
  etatActuelId: string
): Promise<ServiceResponse<UserVoiture>> => {
  try {
    console.log("🔗 DEBUT addVoitureToUser()")
    console.log("   User ID:", userId)
    console.log("   Voiture ID:", voitureId)
    console.log("   État ID:", etatActuelId)
    
    const userVoituresCollection = collection(db, "Users", userId, "Voitures")
    console.log("✅ Chemin collection:", `Users/${userId}/Voitures`)
    
    const docRef = await addDoc(userVoituresCollection, {
      voitureId: voitureId,
      etatActuelId: etatActuelId,
      createdAt: new Date().toISOString()
    })
    
    console.log(`✅ Document créé dans Users/${userId}/Voitures/: ${docRef.id}`)
    
    const userVoiture: UserVoiture = {
      id: docRef.id,
      voitureId,
      etatActuelId,
      createdAt: new Date().toISOString()
    }
    
    return { 
      success: true, 
      message: "Voiture ajoutée à l'utilisateur",
      data: userVoiture
    }
  } catch (error: any) {
    console.error("❌ ERREUR dans addVoitureToUser():", error)
    console.error("   Message:", error.message)
    console.error("   Code:", error.code)
    return { success: false, error: error.message }
  }
}

// Ajouter un historique à une voiture utilisateur
export const addHistoriqueToUserVoiture = async (
  userId: string,
  userVoitureId: string,
  historiqueData: Omit<HistoriqueItem, 'id'>
): Promise<ServiceResponse<void>> => {
  try {
    const historiqueCollection = collection(
      db, 
      "Users", 
      userId, 
      "Voitures", 
      userVoitureId, 
      "Historique"
    )
    
    await addDoc(historiqueCollection, {
      ...historiqueData,
      date: new Date().toISOString()
    })
    
    return { success: true, message: "Historique ajouté" }
  } catch (error: any) {
    console.error("Erreur lors de l'ajout de l'historique:", error)
    return { success: false, error: error.message }
  }
}

// Fonction pour corriger les fautes de frappe dans les données existantes
export const corrigerFautesDeFrappe = async (userId: string): Promise<ServiceResponse<void>> => {
  try {
    console.log("🔧 DEBUT corrigerFautesDeFrappe()")
    
    // Vérifier s'il y a une collection "vulture" au lieu de "Voitures"
    const vultureCollection = collection(db, "Users", userId, "vulture")
    const snapshotVulture = await getDocs(vultureCollection)
    
    if (snapshotVulture.size > 0) {
      console.log(`⚠️ Collection 'vulture' trouvée avec ${snapshotVulture.size} documents`)
      console.log("   Correction en cours...")
      
      // Pour chaque document dans "vulture", le déplacer vers "Voitures"
      for (const docSnapshot of snapshotVulture.docs) {
        const data = docSnapshot.data()
        console.log(`   Document ${docSnapshot.id}:`, data)
        
        // Corriger "etaťActue1Id" en "etatActuelId"
        const donneesCorrigees = {
          voitureId: data.voitureId,
          etatActuelId: data.etaťActue1Id || data.etatActuelId,
          createdAt: data.createdAt || new Date().toISOString()
        }
        
        // Ajouter à la bonne collection
        const voituresCollection = collection(db, "Users", userId, "Voitures")
        await addDoc(voituresCollection, donneesCorrigees)
        
        console.log(`   ✅ Document ${docSnapshot.id} corrigé et déplacé`)
      }
    }
    
    // Vérifier aussi s'il y a "Voitures" (avec la bonne orthographe)
    const voituresCollection = collection(db, "Users", userId, "Voitures")
    const snapshotVoitures = await getDocs(voituresCollection)
    
    console.log(`📊 Documents dans Users/${userId}/Voitures: ${snapshotVoitures.size}`)
    
    // Corriger les fautes de frappe dans les documents existants
    for (const docSnapshot of snapshotVoitures.docs) {
      const data = docSnapshot.data()
      
      // Si le document a "etaťActue1Id", le corriger
      if (data.etaťActue1Id && !data.etatActuelId) {
        console.log(`   Correction du document ${docSnapshot.id}: 'etaťActue1Id' -> 'etatActuelId'`)
        
        await updateDoc(docSnapshot.ref, {
          etatActuelId: data.etaťActue1Id
        })
      }
    }
    
    console.log("✅ FIN corrigerFautesDeFrappe()")
    return { success: true, message: "Données corrigées" }
    
  } catch (error: any) {
    console.error("❌ ERREUR dans corrigerFautesDeFrappe():", error)
    return { success: false, error: error.message }
  }
}

// Récupérer toutes les voitures d'un utilisateur avec les détails - VERSION CORRIGÉE
export const getUserVoituresWithDetails = async (
  userId: string
): Promise<ServiceResponse<any[]>> => {
  try {
    console.log("🔍 DEBUT getUserVoituresWithDetails()")
    console.log("   User ID:", userId)
    
    // 1. D'abord corriger les fautes de frappe
    await corrigerFautesDeFrappe(userId)
    
    // 2. Récupérer les voitures de l'utilisateur
    const userVoituresCollection = collection(db, "Users", userId, "Voitures")
    console.log("✅ Chemin collection:", `Users/${userId}/Voitures`)
    
    const querySnapshot = await getDocs(userVoituresCollection)
    console.log(`📊 Documents trouvés dans Users/${userId}/Voitures: ${querySnapshot.size}`)
    
    const userVoitures: any[] = []
    
    // 3. Pour chaque voiture de l'utilisateur, récupérer les détails
    for (const docSnapshot of querySnapshot.docs) {
      console.log(`📄 Document ID: ${docSnapshot.id}`)
      const data = docSnapshot.data()
      console.log(`   Données brutes:`, data)
      
      const userVoitureData: UserVoiture = {
        id: docSnapshot.id,
        voitureId: data.voitureId,
        etatActuelId: data.etatActuelId || data.etaťActue1Id,
        createdAt: data.createdAt
      }
      
      console.log(`   Données parsées:`, userVoitureData)
      
      // 4. Récupérer les détails de la voiture principale
      const voitureResponse = await getVoitureById(userVoitureData.voitureId)
      
      if (voitureResponse.success && voitureResponse.data) {
        const voiture = voitureResponse.data
        console.log(`   ✅ Voiture trouvée: ${voiture.modele} (ID: ${voiture.id})`)
        
        // 5. Récupérer les pannes depuis la sous-collection
        let pannesNoms: string[] = ["Aucune panne"];
        try {
          const pannesResponse = await getPannesFromVoiture(voiture.id!);
          if (pannesResponse.success && pannesResponse.data && pannesResponse.data.length > 0) {
            pannesNoms = pannesResponse.data.map((panne: any) => panne.nom);
          }
        } catch (panneError) {
          console.log(`   ⚠️ Erreur récupération pannes:`, panneError);
        }
        
        let etatNom = "État inconnu"
        let typeVehicule = voiture.typeVehicule || "Non spécifié"
        
        // 6. Récupérer le nom de l'état
        if (userVoitureData.etatActuelId) {
          try {
            const etatDocRef = doc(db, "Etat", userVoitureData.etatActuelId)
            const etatDocSnap = await getDoc(etatDocRef)
            if (etatDocSnap.exists()) {
              const etatData = etatDocSnap.data()
              etatNom = etatData.nom || etatData.non || etatNom
            }
          } catch (etatError) {
            console.log(`   ⚠️ Erreur récupération état:`, etatError)
          }
        }
        
        // 7. Ajouter au tableau des résultats
        userVoitures.push({
          id: docSnapshot.id,
          userVoitureData,
          voiture,
          typeVehicule: typeVehicule,
          pannesNoms: pannesNoms,
          etatNom,
          dateAjout: userVoitureData.createdAt
        })
        
        console.log(`   ✅ Ajouté: ${voiture.modele} - Pannes: ${pannesNoms.join(', ')} - État: ${etatNom}`)
        
      } else {
        console.log(`   ❌ Voiture non trouvée (ID: ${userVoitureData.voitureId})`)
      }
    }
    
    // Trier par date (la plus récente en premier)
    userVoitures.sort((a, b) => 
      new Date(b.dateAjout).getTime() - new Date(a.dateAjout).getTime()
    )
    
    console.log(`✅ FIN getUserVoituresWithDetails(): ${userVoitures.length} voitures trouvées`)
    return { success: true, data: userVoitures }
    
  } catch (error: any) {
    console.error("❌ ERREUR dans getUserVoituresWithDetails():", error)
    console.error("   Message:", error.message)
    console.error("   Code:", error.code)
    console.error("   Stack:", error.stack)
    return { success: false, error: error.message }
  }
}

// ========== FONCTION COMPLETE POUR AJOUTER UNE VOITURE ==========

// Fonction principale pour ajouter une voiture avec panne
export const ajouterVoitureAvecPannes = async (
  userId: string,
  userEmail: string,
  modele: string,
  panneIds: string[],  // Array d'IDs au lieu d'un seul ID
  typeVehicule: string
): Promise<ServiceResponse<any>> => {
  try {
    console.log("🚗 DEBUT ajouterVoitureAvecPannes()")
    console.log("   Utilisateur:", userId)
    console.log("   Modèle:", modele)
    console.log("   Pannes IDs:", panneIds)  // Log array
    console.log("   Type véhicule:", typeVehicule)
    
    // 1. Créer/mettre à jour l'utilisateur
    console.log("1. Création/mise à jour utilisateur...")
    await createOrUpdateUser(userId, { email: userEmail })
    
    // 2. Récupérer l'état initial
    console.log("2. Récupération de l'état initial...")
    const etatResponse = await getEtatInitial()
    
    if (!etatResponse.success || !etatResponse.data) {
      // ... gestion d'erreur existante
      return { 
        success: false, 
        error: `Impossible de récupérer l'état initial: ${etatResponse.error}` 
      }
    }
    
    const etatInitial = etatResponse.data
    console.log(`✅ État initial trouvé: ${etatInitial.nom} (ID: ${etatInitial.id})`)
    
    // 3. Ajouter la voiture à la collection voitures (sans panneId)
    console.log("3. Ajout de la voiture...")
    const voitureData: Omit<Voiture, 'id'> = {
      modele: modele,
      typeVehicule: typeVehicule,
      createdAt: new Date().toISOString()
      // Note: panneId est supprimé car les pannes vont dans la sous-collection
    }
    
    const voitureResponse = await addVoiture(voitureData)
    if (!voitureResponse.success || !voitureResponse.data) {
      console.error("❌ Erreur ajout voiture:", voitureResponse.error)
      return voitureResponse
    }
    const nouvelleVoiture = voitureResponse.data
    console.log(`✅ Voiture créée: ${nouvelleVoiture.id} (Type: ${typeVehicule})`)
    
    // 4. Ajouter les pannes dans la sous-collection
    console.log("4. Ajout des pannes dans la sous-collection...")
    const pannesList = await getPannes(); // Récupérer toutes les pannes pour avoir les noms
    
    if (pannesList.success && pannesList.data) {
      for (const panneId of panneIds) {
        const panne = pannesList.data.find(p => p.id === panneId);
        if (panne) {
          await addPanneToVoiture(nouvelleVoiture.id!, panneId, panne.nom);
          console.log(`   ➕ Panne ajoutée: ${panne.nom}`);
        }
      }
    }
    
    // 5. Ajouter la voiture à l'utilisateur
    console.log("5. Liaison utilisateur-voiture...")
    const userVoitureResponse = await addVoitureToUser(
      userId, 
      nouvelleVoiture.id!, 
      etatInitial.id
    )
    if (!userVoitureResponse.success || !userVoitureResponse.data) {
      console.error("❌ Erreur liaison utilisateur:", userVoitureResponse.error)
      return userVoitureResponse
    }
    const userVoiture = userVoitureResponse.data
    console.log(`✅ Voiture liée à l'utilisateur: ${userVoiture.id}`)
    
    // 6. Ajouter l'historique initial
    console.log("6. Ajout historique...")
    const historiqueData: Omit<HistoriqueItem, 'id'> = {
      etatId: etatInitial.id,
      etatNom: etatInitial.nom,
      date: new Date().toISOString(),
      commentaire: `Voiture ${typeVehicule === 'particulier' ? 'particulière' : 'poids lourd'} déposée au garage avec ${panneIds.length} panne(s)`
    }
    
    await addHistoriqueToUserVoiture(userId, userVoiture.id!, historiqueData)
    console.log("✅ Historique ajouté")
    
    console.log("🎉 FIN ajouterVoitureAvecPannes() - Succès!")
    
    return { 
      success: true, 
      message: "Voiture ajoutée avec succès",
      data: {
        voiture: nouvelleVoiture,
        userVoiture: userVoiture,
        etatInitial: etatInitial
      }
    }
  } catch (error: any) {
    console.error("❌ ERREUR dans ajouterVoitureAvecPannes():", error)
    return { success: false, error: error.message }
  }
}

// ========== FONCTIONS UTILITAIRES ==========

// Fonction pour obtenir le nom d'une panne par son ID
export const getPanneNomById = async (panneId: string): Promise<ServiceResponse<string>> => {
  try {
    if (!panneId) {
      return { success: false, error: "ID de panne requis" }
    }
    
    const panneDocRef = doc(db, "Pannes", panneId)
    const panneDocSnap = await getDoc(panneDocRef)
    
    if (panneDocSnap.exists()) {
      const panneData = panneDocSnap.data()
      return { 
        success: true, 
        data: panneData.nom || "Nom non défini"
      }
    } else {
      return { success: false, error: "Panne non trouvée" }
    }
  } catch (error: any) {
    console.error("Erreur récupération nom panne:", error)
    return { success: false, error: error.message }
  }
}

// Fonction pour obtenir le nom d'un état par son ID
export const getEtatNomById = async (etatId: string): Promise<ServiceResponse<string>> => {
  try {
    if (!etatId) {
      return { success: false, error: "ID d'état requis" }
    }
    
    const etatDocRef = doc(db, "Etat", etatId)
    const etatDocSnap = await getDoc(etatDocRef)
    
    if (etatDocSnap.exists()) {
      const etatData = etatDocSnap.data()
      return { 
        success: true, 
        data: etatData.nom || etatData.non || "Nom non défini"
      }
    } else {
      return { success: false, error: "État non trouvé" }
    }
  } catch (error: any) {
    console.error("Erreur récupération nom état:", error)
    return { success: false, error: error.message }
  }
}

// Supprimer une voiture utilisateur
export const deleteUserVoiture = async (
  userId: string,
  userVoitureId: string
): Promise<ServiceResponse<void>> => {
  try {
    const userVoitureRef = doc(db, "Users", userId, "Voitures", userVoitureId)
    await deleteDoc(userVoitureRef)
    
    return { success: true, message: "Voiture supprimée" }
  } catch (error: any) {
    console.error("Erreur suppression voiture utilisateur:", error)
    return { success: false, error: error.message }
  }
}