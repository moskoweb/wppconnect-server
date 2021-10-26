import config from '../../config.json';

var FirebaseTokenStore = function (client) {
  this.tokenStore = {
    getToken: (sessionName) => {
      try {
        const id = req.body.session;
        const Session = await firestore.collection('Sessions').doc(id);
        const data = await Session.get();
        if (!data.exists) {
            res.status(404).send('Session with the given ID not found');
        } else {
            res.send(data.data());
        }
      } catch (error) {
          res.status(400).send(error.message);
      }
    },
    setToken: (sessionName, tokenData) => {
      try {
        const id = req.body.session;
        const data = req.body;
        const Session = await firestore.collection('Sessions').doc(id);
        await Session.update(data);
        res.send('Session record updated successfuly');
      } catch (error) {
          res.status(400).send(error.message);
      }
    },
    removeToken: (sessionName) => {
      try {
        const id = req.body.session;
        if (!id) {
            res.status(400).json({
                result: 400,
                "status": "FAIL",
                "reason": "Session não informada"
            })
        }
        const Session = await firestore.collection('Sessions').doc(id);
        const data = await Session.get();
        if (!data.exists) {
            res.status(404).json({
                result: 404,
                "status": "FAIL",
                "reason": `Session ${id} não existe no firebase`
            })
        }
        else {
            await firestore.collection('Sessions').doc(id).delete();
            res.status(200).json({
                result: 200,
                "status": "SUCCESS",
                "reason": `Session ${id} deletada com sucesso no firebase!!`
            })
        }
      } catch (error) {
          res.status(400).send(error.message);
      }
    },
    listTokens: () => {
      try {
        const Sessions = await firestore.collection('Sessions');
        const data = await Sessions.get();
        const SessionsArray = [];
        if (data.empty) {
            res.status(404).send('No Session record found');
        } else {
            data.forEach(doc => {
                const Session = new SessionsDB(
                    doc.id,
                    doc.data().session,
                    doc.data().apitoken,
                    doc.data().sessionkey,
                    doc.data().wh_status,
                    doc.data().wh_message,
                    doc.data().wh_qrcode,
                    doc.data().wh_connect,
                    doc.data().WABrowserId,
                    doc.data().WASecretBundle,
                    doc.data().WAToken1,
                    doc.data().WAToken2
                );
                SessionsArray.push(Session);
            });
            res.send(SessionsArray);
        }
      } catch (error) {
          res.status(400).send(error.message);
      }
    },
  };
};

module.exports = FirebaseTokenStore;
