// pages/api/movies/[idMovie]/comments/idComments

/* Nous effectuons les imports des dépendances externes (node_modules ou fichiers internes) */
import clientPromise from "../../../../../lib/mongodb";
import { ObjectId } from "mongodb";

/*
 La fonction 'handler' est la fonction principale du 'endpoint API' (une sorte de porte d'entrée de notre API)
 Les mots clés 'export', 'default' et 'async' sont nécéssaires.
 La fonction 'handler' donne accès aux reférences de nos requête ('req') et réponse ('res') HTTP.
 Ces deux paramètres seront nécéssaires pour manipuler les données envoyées en requêtes
 et les données à insérer dans la réponse.
 */
export default async function handler(req, res) {

  // Depuis l'objet de requête 'req', nous récupérons un query-params HTTP via la clé 'query'.
  // L'objet 'req' se manipule ainsi, comme une données JSON classique.
  // Nous obtenons ici l'id du film passé en paramètre de l'URL lors de l'appel HTTP d'un client
  // La clé 'idComments' correspond à la clé utilisée pour nommer le fichier déclarant ce endpoint.
  const idComments = req.query.idComments

  // Ici, ces deux instructions sont nécéssaires pour établir la connexion à la base de données.
  const client = await clientPromise;
  const db = client.db("sample_mflix");

  // Nous pouvons pré-déclarer des variables avant le switch-case.
  // Ici la variable 'dbMovie' va nous servir dans plusieurs cas du switch-case,
  // nous préférons donc la déclarer avant, qu'une seule fois, afin d'éviter la duplication de code inutile.
  let dbComments = {};


  // Nous établissons plusieurs cas à exécuter conditionnellement en fonction du verbe HTTP utilisé pour l'appel
  // La 'method' d'appel est donc disponible dans l'objet de requête.
  switch (req.method) {

    // Appel du endpoint pour supprimer un film à partir de son id technique ('_id' généré par MongoDB).
    case "DELETE":
      try {
        // Supprimer le film correspondant à l'ID spécifié.
        const result = await db.collection("comments").deleteOne({ _id: new ObjectId(idComments) });
    
        // Vérifier si un document a été supprimé avec succès.
        if (result.deletedCount === 1) {
          // Si un document a été supprimé avec succès, renvoyer une réponse 200 (No Content).
          res.status(200).end();
        } else {
          // Si aucun document n'a été trouvé avec l'ID spécifié, renvoyer une réponse 404 (Not Found).
          res.status(404).json({ status: 404, msg: "Comment not found" });
        }
      } catch (e) {
        // En cas d'erreur, renvoyer une réponse 500 (Internal Server Error).
        res.status(500).json({ status: 500, data: "SERVER ERROR" });
      }
      break;
    

    // Appel du endpoint pour modifier un film à partir de son id technique
    // et d'un objet passé en body-params de la requête (clé 'body').
    case "PUT":

      // Récupération de l'objet passé en paramètre.
      // Nous partons pour le moment du principe que cet objet ne contient que
      // des clés présentes dans la structure de base des objets de la BDD (collection 'comments').
      // Dans l'idéal, nous effectuerons un check de la structure envoyée avant de l'utiliser directement en base.
      const bodyParams = req.body;

      // Le try-catch permet brievement "d'attraper" si une erreur est "jetée" lors de l'accession à la BDD
      try {
        const dbReturn = await db.collection("comments").updateOne(
          { _id : new ObjectId(idComments) },
          { $set: bodyParams }
        );

        // Nous renvoyons au client une réponse HTTP contenant le status et le retour de la base de données
        res.json({ status: 200, data: dbReturn });
      }
      catch (e) {
        // Si une erreur est trouvée, nous renvoyons une 400
        res.json({ status: 400, data: "SERVER ERROR" });
      }
    break;

    // Appel du endpoint pour ajouter un film à partir de son id technique
    // et d'un objet passé en body-params de la requête (clé 'body').
    case "POST":
      // Dans ce cas pour la création d'un commentaire, le movie_id est récupérer de l'url
      // pour y etre automatiquement ajouter
      //exemple de la requete:
      //{
      //"name": "Jaqen",
      //"email": "ouiiiiii@gameofthron.es",
      // "text": "Minima odit officiis minima nam. Aspernatur id reprehenderit eius inventore amet laudantium. Eos unde enim recusandae fugit sint.",
      //"date": "1981-12-17T16:32:25.000Z"
      //}

      
      try {
        const idMovie = new ObjectId(req.query.idMovie); // Obtenir l'ID du film à partir des paramètres de la requête
        const bodyParams = req.body; // Les données du commentaire envoyées par le client

        // Ajouter l'ID du film à l'objet bodyParams
        bodyParams.movie_id = idMovie;

        // Insertion du commentaire dans la base de données
        const dbReturn = await db.collection("comments").insertOne(bodyParams);

        // Récupération du commentaire ajouté avec l'ID généré par MongoDB
        const dbComment = await db.collection("comments").findOne({ _id: new ObjectId(dbReturn.insertedId) });

        // Renvoyer le commentaire ajouté au client
        res.status(200).json({ status: 200, data: dbComment });
      } catch (error) {
        // En cas d'erreur, renvoyer une réponse avec le statut 400 (Bad Request)
        console.error("Error:", error);
        res.status(400).json({ status: 400, data: "BAD REQUEST" });
      }
      break;


    // Appel du endpoint pour récupérer les données d'une ressource liée à un film via son id technique ('_id')
    case "GET":

      try {

        // La variable dbMovie récupère le retour de l'accès à la BDD avec la fonction 'findOne' de MongoDB.
        // Cette fonction est appelée avec l'id technique du film passé en paramètre d'URL de la requête.
        dbComments = await db.collection("comments").findOne({ _id : new ObjectId(idComments) });
        // La BDD pour cette méthode renvoie toute la ressource du film, nous la renvoyons donc au client tel quel.
        res.json({ status: 200, data: {movie: dbComments} });
        break;

      }
      catch (e) {
        res.json({ status: 400, data: "SERVER ERROR" });
      };

    // Cas par défaut, si aucun des verbes précédents n'a matché
    default:
      res.json({ status: 400, msg: "HTTP METHOD NOT FOUND" });
      break;

  // Fin du switch-case
  }
// Fin de la fontion 'handler'
}
