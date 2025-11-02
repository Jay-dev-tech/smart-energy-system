
'use client';
    
import {
  set,
  push,
  update,
  remove,
  DatabaseReference,
} from 'firebase/database';
import { errorEmitter } from './error-emitter';
import {FirestorePermissionError} from './errors';

/**
 * Initiates a set operation for a database reference.
 * Does NOT await the write operation internally.
 */
export function setDocumentNonBlocking(docRef: DatabaseReference, data: any) {
  set(docRef, data).catch(error => {
    errorEmitter.emit(
      'permission-error',
      new FirestorePermissionError({
        path: docRef.toString(),
        operation: 'write', 
        requestResourceData: data,
      })
    )
  })
}

/**
 * Initiates an addDoc operation for a collection reference.
 * Does NOT await the write operation internally.
 * Returns the Promise for the new doc ref, but typically not awaited by caller.
 */
export function addDocumentNonBlocking(colRef: DatabaseReference, data: any) {
  const promise = push(colRef, data)
    .catch(error => {
      errorEmitter.emit(
        'permission-error',
        new FirestorePermissionError({
          path: colRef.toString(),
          operation: 'create',
          requestResourceData: data,
        })
      )
    });
  return promise;
}


/**
 * Initiates an updateDoc operation for a document reference.
 * Does NOT await the write operation internally.
 */
export function updateDocumentNonBlocking(docRef: DatabaseReference, data: any) {
  update(docRef, data)
    .catch(error => {
      errorEmitter.emit(
        'permission-error',
        new FirestorePermissionError({
          path: docRef.toString(),
          operation: 'update',
          requestResourceData: data,
        })
      )
    });
}


/**
 * Initiates a deleteDoc operation for a document reference.
 * Does NOT await the write operation internally.
 */
export function deleteDocumentNonBlocking(docRef: DatabaseReference) {
  remove(docRef)
    .catch(error => {
      errorEmitter.emit(
        'permission-error',
        new FirestorePermissionError({
          path: docRef.toString(),
          operation: 'delete',
        })
      )
    });
}
