// pages/api/movies/[idMovie]/comments.js
import { ObjectId } from "mongodb";
import clientPromise from "../../../../lib/mongodb";

export default async function handler(req, res) {
  try {
    const idMovie  = new ObjectId(req.query.idMovie); // Obtenir l'ID du film à partir des paramètres de la requête

    const client = await clientPromise;
    const db = client.db("sample_mflix");

    // Récupérer les commentaires associés à un film spécifique par son ID
    const comments = await db.collection("comments").find({ movie_id: idMovie }).toArray();

    console.log(idMovie);
    // Renvoyer les commentaires récupérés au client
    res.status(200).json({ status: 200, data: comments });
  } catch (error) {
    // En cas d'erreur, renvoyer une réponse avec le statut 500 (Internal Server Error)
    console.error("Error:", error);
    res.status(500).json({ status: 500, data: "SERVER ERROR" });
  }
}
