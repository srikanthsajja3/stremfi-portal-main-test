import React, {
  useContext,
  useEffect,
  useRef,
  useState
} from "react";

import { useNavigate } from "react-router-dom";

import { UserContext } from "./UserContext";

import apiClient from "../api/client";

import { toast } from "react-toastify";

import {
  readDigilockerSession,
  clearDigilockerSession,
  saveDigilockerResult
} from "./digilockerSession";


const DigilockerCallback = () => {

  const { token } = useContext(UserContext);

  const navigate = useNavigate();

  const [status, setStatus] =
    useState("processing");

  /*
   * Prevent the callback from being processed
   * more than once during the same React mount.
   */
  const processingRef = useRef(false);


  useEffect(() => {

    /*
     * Wait until UserContext has restored the
     * authentication token.
     */
    if (!token) {
      return;
    }

    /*
     * Prevent duplicate execution.
     */
    if (processingRef.current) {
      return;
    }

    processingRef.current = true;


    const session =
      readDigilockerSession();


    /*
     * No DigiLocker session means that this page
     * was opened directly or the session expired.
     */
    if (!session?.clientId) {

      console.error(
        "DigiLocker callback session not found"
      );

      toast.error(
        "DigiLocker verification session not found."
      );

      setStatus("error");

      processingRef.current = false;

      return;
    }


    const finish = async () => {

      try {

        console.log(
          "DigiLocker callback started"
        );

        console.log(
          "Client ID:",
          session.clientId
        );


        // =====================================================
        // DOWNLOAD AADHAAR
        // =====================================================

        const res = await apiClient.post(
          "/customer/digilocker_download_aadhaar.php",
          {
            client_id:
              session.clientId
          },
          {
            validateStatus: () => true
          }
        );


        // =====================================================
        // HANDLE HTTP ERROR
        // =====================================================

        if (res.status < 200 || res.status >= 300) {

          const errorData = res.data;

          console.error(
            "DigiLocker download HTTP error:",
            res.status,
            errorData
          );

          toast.error(
            errorData?.error ||
            `Aadhaar verification failed (${res.status})`
          );

          setStatus("error");

          return;
        }


        // =====================================================
        // PARSE RESPONSE
        // =====================================================

        const data =
          res.data;


        console.log(
          "DigiLocker download response:",
          data
        );


        // =====================================================
        // API ERROR
        // =====================================================

        if (!data.success) {

          toast.error(
            data.error ||
            "Aadhaar verification failed"
          );

          setStatus("error");

          return;
        }


        // =====================================================
        // SAVE RESULT
        // =====================================================

        saveDigilockerResult({

          verification_id:
            data.verification_id,

          customer:
            data.customer,

          /*
           * VERY IMPORTANT:
           *
           * Restore everything the user entered before
           * going to DigiLocker.
           */
          pendingData:
            session.pendingData

        });


        // =====================================================
        // CLEAR CALLBACK SESSION
        // =====================================================

        clearDigilockerSession();


        // =====================================================
        // RETURN TO ORIGINAL PAGE
        // =====================================================

        const returnPath =
          session.returnPath ||
          "/customers";


        console.log(
          "Returning to:",
          returnPath
        );


        navigate(
          returnPath,
          {
            replace: true
          }
        );

      } catch (error) {

        console.error(
          "DigiLocker callback error:",
          error
        );

        toast.error(
          "Unable to complete Aadhaar verification"
        );

        setStatus("error");

      } finally {

        processingRef.current = false;

      }

    };


    finish();

  }, [token, navigate]);


  // ===========================================================
  // ERROR
  // ===========================================================

  if (status === "error") {

    return (
      <div
        style={{
          padding: 40,
          textAlign: "center"
        }}
      >

        <h3>
          Aadhaar Verification Failed
        </h3>

        <p>
          We couldn't confirm your Aadhaar
          verification.
        </p>

        <button
          type="button"
          onClick={() =>
            navigate(-1)
          }
        >
          Go Back
        </button>

      </div>
    );
  }


  // ===========================================================
  // PROCESSING
  // ===========================================================

  return (
    <div
      style={{
        padding: 40,
        textAlign: "center"
      }}
    >

      <h3>
        Completing Aadhaar Verification
      </h3>

      <p>
        Please wait while we retrieve your
        verified Aadhaar details...
      </p>

    </div>
  );
};


export default DigilockerCallback;