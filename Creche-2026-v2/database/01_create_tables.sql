-- =============================================
-- Base de données : CrecheManager
-- Étape 1 : Création des tables SQL Server
-- =============================================

CREATE DATABASE CrecheManager;
GO

USE CrecheManager;
GO

-- =============================================
-- Table : children (enfants inscrits)
-- =============================================
CREATE TABLE children (
    id              NVARCHAR(50)    PRIMARY KEY,
    nom             NVARCHAR(100)   NOT NULL,
    prenom          NVARCHAR(100)   NOT NULL,
    date_naissance  DATE            NOT NULL,
    date_inscription DATE           NOT NULL,
    sexe            NVARCHAR(10)    NOT NULL CHECK (sexe IN ('Garçon', 'Fille')),
    section         NVARCHAR(20)    NOT NULL CHECK (section IN ('Petite', 'Moyenne', 'Préscolaire')),
    nom_pere        NVARCHAR(100)   DEFAULT '',
    nom_mere        NVARCHAR(100)   DEFAULT '',
    num_pere        NVARCHAR(20)    DEFAULT '',
    num_mere        NVARCHAR(20)    DEFAULT ''
);
GO

-- =============================================
-- Table : payments (paiements mensuels)
-- =============================================
CREATE TABLE payments (
    child_id        NVARCHAR(50)    NOT NULL,
    year            INT             NOT NULL,
    month           INT             NOT NULL CHECK (month BETWEEN 1 AND 12),
    amount_paid     DECIMAL(10, 2)  NOT NULL DEFAULT 0,
    payment_date    NVARCHAR(30)    NOT NULL,

    PRIMARY KEY (child_id, year, month),
    FOREIGN KEY (child_id) REFERENCES children(id) ON DELETE CASCADE
);
GO

-- =============================================
-- Table : settings (paramètres de la crèche)
-- =============================================
CREATE TABLE settings (
    id              INT             PRIMARY KEY DEFAULT 1 CHECK (id = 1),
    name            NVARCHAR(200)   NOT NULL,
    rc              NVARCHAR(50)    DEFAULT '',
    nif             NVARCHAR(50)    DEFAULT '',
    article         NVARCHAR(50)    DEFAULT '',
    agrement        NVARCHAR(50)    DEFAULT '',
    address         NVARCHAR(200)   DEFAULT '',
    tel             NVARCHAR(20)    DEFAULT '',
    city            NVARCHAR(100)   DEFAULT ''
);
GO

-- Ligne vide par défaut, à remplir depuis l'application
INSERT INTO settings (id, name) VALUES (1, '');
GO

PRINT 'Base CrecheManager créée avec succès.';
GO
