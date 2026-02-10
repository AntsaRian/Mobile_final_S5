// src/services/paiementService.ts
import { db, HistoriqueItem } from '@/firebase/config';
import { 
  doc, collection, query, where, getDocs, updateDoc 
} from 'firebase/firestore';
import { addHistoriqueToUserVoiture } from './firestoreService';

export const payer_reparation = async (id_user: string, id_voiture: string) => {
  try {
    console.log("💰 DEBUT payer_reparation()");
    console.log("IDs reçus:", { id_user, id_voiture });
    
    // Vérification des IDs
    if (!id_user || !id_voiture) {
      return { 
        success: false, 
        error: "Informations manquantes" 
      };
    }
    
    // 1. Chercher le userVoitureId correspondant à cette voiture
    const userVoituresCollection = collection(db, "Users", id_user, "Voitures");
    const userVoituresQuery = query(
      userVoituresCollection, 
      where("voitureId", "==", id_voiture)
    );
    
    const userVoituresSnapshot = await getDocs(userVoituresQuery);
    
    if (userVoituresSnapshot.empty) {
      return { 
        success: false, 
        error: "Aucune réparation trouvée pour cette voiture" 
      };
    }
    
    const userVoitureDoc = userVoituresSnapshot.docs[0];
    const id_user_voiture = userVoitureDoc.id;
    console.log("✅ UserVoitureId trouvé:", id_user_voiture);
    
    // 2. Chercher l'état "payé"
    const etatsCollection = collection(db, "Etat");
    const q = query(
      etatsCollection, 
      where("nom", "in", ["payé", "paye", "Payé", "Paye", "PAYÉ"])
    );
    
    const etatSnapshot = await getDocs(q);
    
    if (etatSnapshot.empty) {
      return { success: false, error: "État 'payé' introuvable" };
    }
    
    const etatPayeDoc = etatSnapshot.docs[0];
    const etatPayeNom = etatPayeDoc.data().nom;
    
    // 3. Mettre à jour la voiture
    const voitureRef = doc(db, "Voitures", id_voiture);
    await updateDoc(voitureRef, {
      etat: etatPayeNom,
      updatedAt: new Date().toISOString()
    });
    
    // 4. Mettre à jour dans Users/{userId}/Voitures/{userVoitureId}
    const userVoitureRef = doc(db, "Users", id_user, "Voitures", id_user_voiture);
    await updateDoc(userVoitureRef, {
      etatActuelId: etatPayeDoc.id,
      etatActuelNom: etatPayeNom,
      datePaiement: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
    
    // 5. Ajouter à l'historique
    const historiqueData: Omit<HistoriqueItem, 'id'> = {
      etatNom: etatPayeNom,
      date: new Date().toISOString(),
      commentaire: "Réparation payée",
      type: "paiement"
    };
    
    await addHistoriqueToUserVoiture(id_user, id_user_voiture, historiqueData);
    
    console.log("✅ Paiement réussi");
    return { 
      success: true, 
      message: "Paiement effectué",
      data: { etat: etatPayeNom }
    };
    
  } catch (error: any) {
    console.error("❌ Erreur paiement:", error);
    return { success: false, error: error.message };
  }
};