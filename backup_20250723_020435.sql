-- MySQL dump 10.13  Distrib 8.0.42, for Linux (x86_64)
--
-- Host: localhost    Database: neighbourhood
-- ------------------------------------------------------
-- Server version	8.0.42-0ubuntu0.24.04.2

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `atms`
--

DROP TABLE IF EXISTS `atms`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `atms` (
  `id` int NOT NULL AUTO_INCREMENT,
  `atm_id` varchar(50) NOT NULL,
  `location` varchar(255) NOT NULL,
  `parish` varchar(100) NOT NULL,
  `latitude` float DEFAULT NULL,
  `longitude` float DEFAULT NULL,
  `deposit_available` tinyint(1) DEFAULT NULL,
  `status` varchar(50) NOT NULL,
  `last_used` varchar(50) DEFAULT NULL,
  `timestamp` datetime DEFAULT NULL,
  `geocoding_failed` tinyint(1) DEFAULT NULL,
  `created_at` datetime DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `atm_id` (`atm_id`)
) ENGINE=InnoDB AUTO_INCREMENT=51 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `atms`
--

LOCK TABLES `atms` WRITE;
/*!40000 ALTER TABLE `atms` DISABLE KEYS */;
INSERT INTO `atms` VALUES (1,'151','sbj_Worthy Park','St Catherine',18.1447,-77.1466,0,'WORKING','00:28:49','2025-07-22 20:50:02',0,'2025-07-22 23:47:23','2025-07-23 02:01:22'),(2,'153','sbj_Eight Rivers Town','St Anns',18.4109,-77.101,1,'WORKING','00:10:02','2025-07-22 20:50:02',0,'2025-07-22 23:47:23','2025-07-23 02:01:22'),(3,'111','sbj_FESCO Chapelton Road','Clarendon',17.9759,-77.2463,0,'WORKING','00:21:11','2025-07-22 20:50:02',0,'2025-07-22 23:47:23','2025-07-23 02:01:22'),(4,'155','sbj_SBJ Drax Hall','St Ann',18.4269,-77.1793,0,'DOWN','07:44:19','2025-07-22 20:50:02',0,'2025-07-22 23:47:23','2025-07-23 02:01:22'),(5,'156','sbj_SBJ Richmond','St Ann',18.4519,-77.2412,0,'WORKING','00:34:31','2025-07-22 20:50:02',0,'2025-07-22 23:47:23','2025-07-23 02:01:22'),(6,'113','sbj_Bargain Village','Clarendon',17.967,-77.2416,0,'DOWN','05:54:02','2025-07-22 20:50:02',0,'2025-07-22 23:47:23','2025-07-23 02:01:22'),(7,'631','sbj_Tropical Plaza','Kingston',18.0148,-76.7962,1,'WORKING','00:13:31','2025-07-22 20:50:02',0,'2025-07-22 23:47:23','2025-07-23 02:01:22'),(8,'115','sbj_Heritage Mall #1','St Catherine',17.9909,-76.9527,0,'WORKING','00:14:02','2025-07-22 20:50:02',0,'2025-07-22 23:47:23','2025-07-23 02:01:22'),(9,'632','sbj_Ken Loshushan','Kingston',18.0297,-76.7775,0,'WORKING','00:39:34','2025-07-22 20:50:02',0,'2025-07-22 23:47:23','2025-07-23 02:01:22'),(10,'116','sbj_Heritage Mall #2','St Catherine',17.9909,-76.9527,0,'WORKING','00:16:50','2025-07-22 20:50:02',0,'2025-07-22 23:47:23','2025-07-23 02:01:22'),(11,'633','sbj_HWT1 6c Constant Spring Road','Kingston',18.0126,-76.7976,0,'WORKING','00:15:46','2025-07-22 20:50:02',0,'2025-07-22 23:47:23','2025-07-23 02:01:22'),(12,'117','sbj_Shopping Center','St Catherine',17.9522,-76.8757,0,'WORKING','00:36:19','2025-07-22 20:50:02',0,'2025-07-22 23:47:23','2025-07-23 02:01:22'),(13,'634','sbj_Sigma Building - Knutsford Blvd','Kingston',18.0056,-76.7876,0,'DOWN','00:40:06','2025-07-22 20:50:02',0,'2025-07-22 23:47:23','2025-07-23 02:01:22'),(14,'118','sbj_Millennium Mall','Clarendon',17.9475,-77.2407,0,'DOWN','04:46:19','2025-07-22 20:50:02',0,'2025-07-22 23:47:23','2025-07-23 02:01:22'),(15,'635','sbj_HWT2 6c Constant Spring Road','Kingston',18.0126,-76.7976,0,'WORKING','00:32:35','2025-07-22 20:50:02',0,'2025-07-22 23:47:23','2025-07-23 02:01:22'),(16,'11','sbj_Duke Street Branch','Kingston',17.9727,-76.7905,0,'WORKING','00:20:25','2025-07-22 20:50:02',0,'2025-07-22 23:47:23','2025-07-23 02:01:22'),(17,'13','sbj_Yallahs','St. Thomas',17.8768,-76.5517,0,'WORKING','00:13:36','2025-07-22 20:50:02',0,'2025-07-22 23:47:23','2025-07-23 02:01:22'),(18,'14','sbj_SBJ 1A Retirement Rd','Kingston',17.9948,-76.7888,0,'WORKING','00:13:34','2025-07-22 20:50:02',0,'2025-07-22 23:47:23','2025-07-23 02:01:22'),(19,'201','sbj_Up Park Camp #1','Kingston',17.9923,-76.7832,0,'WORKING','00:11:23','2025-07-22 20:50:02',0,'2025-07-22 23:47:23','2025-07-23 02:01:22'),(20,'202','sbj_Up Park Camp #2','Kingston',17.9923,-76.7832,1,'WORKING','00:16:09','2025-07-22 20:50:02',0,'2025-07-22 23:47:23','2025-07-23 02:01:22'),(21,'203','sbj_JDF Camp','St. Ann',18.3281,-77.2405,0,'WORKING','00:25:05','2025-07-22 20:50:02',0,'2025-07-22 23:47:23','2025-07-23 02:01:22'),(22,'204','sbj_Up Park Camp #3','Kingston',17.9923,-76.7832,1,'DOWN','02:23:00','2025-07-22 20:50:02',0,'2025-07-22 23:47:23','2025-07-23 02:01:22'),(23,'61','sbj_Black River Branch','St. Elizabeth',18.0335,-77.8567,0,'WORKING','00:17:50','2025-07-22 20:50:02',0,'2025-07-22 23:47:23','2025-07-23 02:01:22'),(24,'62','sbj_10-12E Street','St Catherine',18.0364,-77.0564,0,'WORKING','00:12:44','2025-07-22 20:50:02',0,'2025-07-22 23:47:23','2025-07-23 02:01:22'),(25,'63','sbj_SBJ In Town SuperCenter','St Elizabeth',18.0788,-77.6994,0,'DOWN','01:41:18','2025-07-22 20:50:02',0,'2025-07-22 23:47:23','2025-07-23 02:01:22'),(26,'21','sbj_SBJ New Brunswick #1','St Catherine',18.0364,-77.0564,1,'WORKING','00:11:01','2025-07-22 20:50:02',0,'2025-07-22 23:47:23','2025-07-23 02:01:22'),(27,'22','sbj_SBJ New Brunswick #2','St Catherine',18.0364,-77.0564,1,'WORKING','00:29:30','2025-07-22 20:50:02',0,'2025-07-22 23:47:23','2025-07-23 02:01:22'),(28,'4151','sbj_Manor Park Branch','Kingson',18.0519,-76.7897,0,'DOWN','00:58:41','2025-07-22 20:50:02',0,'2025-07-22 23:47:23','2025-07-23 02:01:22'),(29,'31','sbj_LOJ Shopping Centre','St James',18.3923,-77.8596,1,'DOWN','00:45:07','2025-07-22 20:50:02',0,'2025-07-22 23:47:23','2025-07-23 02:01:22'),(30,'32','sbj_Barnett Tech Park','St James',18.4557,-77.916,0,'WORKING','00:21:39','2025-07-22 20:50:02',0,'2025-07-22 23:47:23','2025-07-23 02:01:22'),(31,'33','sbj_SBJ Overton Plaza','St James',18.4744,-77.9182,0,'WORKING','00:22:55','2025-07-22 20:50:02',0,'2025-07-22 23:47:23','2025-07-23 02:01:22'),(32,'35','sbj_Fairview','St James',18.3923,-77.8596,0,'WORKING','00:23:20','2025-07-22 20:50:02',0,'2025-07-22 23:47:23','2025-07-23 02:01:22'),(33,'141','sbj_Portmore Branch','St Catherine',17.9784,-76.8716,0,'WORKING','00:16:26','2025-07-22 20:50:02',0,'2025-07-22 23:47:23','2025-07-23 02:01:22'),(34,'142','sbj_Portmore Town Centre','St Catherine',17.9589,-76.8892,0,'WORKING','00:13:11','2025-07-22 20:50:02',0,'2025-07-22 23:47:23','2025-07-23 02:01:22'),(35,'143','sbj_PriceSmart Portmore','St Catherine',17.959,-76.9017,0,'WORKING','00:15:55','2025-07-22 20:50:02',0,'2025-07-22 23:47:23','2025-07-23 02:01:22'),(36,'341','sbj_Dominica Bank Head Office #1','Kingston',18.0179,-76.8099,1,'WORKING','00:23:51','2025-07-22 20:50:02',0,'2025-07-22 23:47:23','2025-07-23 02:01:22'),(37,'342','sbj_Sagicor Life Head Office','Kingston',18.0082,-76.7877,0,'DOWN','01:28:33','2025-07-22 20:50:02',0,'2025-07-22 23:47:23','2025-07-23 02:01:22'),(38,'145','sbj_SBJ Sovereign Village','St Catherine',17.9616,-76.8975,0,'WORKING','00:10:18','2025-07-22 20:50:02',0,'2025-07-22 23:47:23','2025-07-23 02:01:22'),(39,'343','sbj_85 Constant Spring Road','Kingston',18.0253,-76.7968,0,'WORKING','00:30:56','2025-07-22 20:50:02',0,'2025-07-22 23:47:23','2025-07-23 02:01:22'),(40,'344','sbj_S Foods Supermarket Worthington Ave','Kingston',18.0077,-76.7817,0,'WORKING','','2025-07-22 20:50:02',0,'2025-07-22 23:47:23','2025-07-23 02:01:22'),(41,'345','sbj_Dominica Bank Head Office #2','Kingston',18.0179,-76.8099,0,'DOWN','00:45:12','2025-07-22 20:50:02',0,'2025-07-22 23:47:23','2025-07-23 02:01:22'),(42,'501','sbj_Soveriegn Center','Kingston',18.0563,-76.7917,0,'WORKING','00:33:11','2025-07-22 20:50:02',0,'2025-07-22 23:47:23','2025-07-23 02:01:22'),(43,'502','sbj_Sipset Wholesale','Kington',18.0179,-76.8099,0,'WORKING','00:13:00','2025-07-22 20:50:02',0,'2025-07-22 23:47:23','2025-07-23 02:01:22'),(44,'503','sbj_Kingslanding Service Station','St Catherine',18.1341,-77.0214,0,'WORKING','00:20:30','2025-07-22 20:50:02',0,'2025-07-22 23:47:23','2025-07-23 02:01:22'),(45,'81','sbj_Great George Street','Westmoreland',18.215,-78.1337,1,'WORKING','00:12:40','2025-07-22 20:50:02',0,'2025-07-22 23:47:23','2025-07-23 02:01:22'),(46,'505','sbj_SBJ 138 SL UWI','Kingston',18.0017,-76.7439,0,'WORKING','00:18:02','2025-07-22 20:50:02',0,'2025-07-22 23:47:23','2025-07-23 02:01:22'),(47,'506','sbj_Berry-Don','St Catherine',18.1366,-77.0316,0,'WORKING','00:26:05','2025-07-22 20:50:02',0,'2025-07-22 23:47:23','2025-07-23 02:01:22'),(48,'41','sbj_Megamart Bloomfield','Manchester',18.0355,-77.5117,0,'DOWN','01:23:09','2025-07-22 20:50:02',0,'2025-07-22 23:47:23','2025-07-23 02:01:22'),(49,'42','sbj_Central Dealers Mall','Manchester',18.067,-77.5161,0,'DOWN','01:02:56','2025-07-22 20:50:02',0,'2025-07-22 23:47:23','2025-07-23 02:01:22'),(50,'43','sbj_Spauldings','Manchester',18.0312,-77.5046,0,'WORKING','00:11:39','2025-07-22 20:50:02',0,'2025-07-22 23:47:23','2025-07-23 02:01:22');
/*!40000 ALTER TABLE `atms` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `geocoding_cache`
--

DROP TABLE IF EXISTS `geocoding_cache`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `geocoding_cache` (
  `id` int NOT NULL AUTO_INCREMENT,
  `location` varchar(255) NOT NULL,
  `parish` varchar(100) NOT NULL,
  `latitude` float NOT NULL,
  `longitude` float NOT NULL,
  `created_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=51 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `geocoding_cache`
--

LOCK TABLES `geocoding_cache` WRITE;
/*!40000 ALTER TABLE `geocoding_cache` DISABLE KEYS */;
INSERT INTO `geocoding_cache` VALUES (1,'Worthy Park','St Catherine',18.1447,-77.1466,'2025-07-22 23:47:18'),(2,'Eight Rivers Town','St Anns',18.4109,-77.101,'2025-07-22 23:47:18'),(3,'FESCO Chapelton Road','Clarendon',17.9759,-77.2463,'2025-07-22 23:47:18'),(4,'SBJ Drax Hall','St Ann',18.4269,-77.1793,'2025-07-22 23:47:18'),(5,'SBJ Richmond','St Ann',18.4519,-77.2412,'2025-07-22 23:47:18'),(6,'Bargain Village','Clarendon',17.967,-77.2416,'2025-07-22 23:47:18'),(7,'Tropical Plaza','Kingston',18.0148,-76.7962,'2025-07-22 23:47:18'),(8,'Heritage Mall #1','St Catherine',17.9909,-76.9527,'2025-07-22 23:47:18'),(9,'Ken Loshushan','Kingston',18.0297,-76.7775,'2025-07-22 23:47:19'),(10,'Heritage Mall #2','St Catherine',17.9909,-76.9527,'2025-07-22 23:47:19'),(11,'HWT1 6c Constant Spring Road','Kingston',18.0126,-76.7976,'2025-07-22 23:47:19'),(12,'Shopping Center','St Catherine',17.9522,-76.8757,'2025-07-22 23:47:19'),(13,'Sigma Building - Knutsford Blvd','Kingston',18.0056,-76.7876,'2025-07-22 23:47:19'),(14,'Millennium Mall','Clarendon',17.9475,-77.2407,'2025-07-22 23:47:19'),(15,'HWT2 6c Constant Spring Road','Kingston',18.0126,-76.7976,'2025-07-22 23:47:19'),(16,'Duke Street Branch','Kingston',17.9727,-76.7905,'2025-07-22 23:47:19'),(17,'Yallahs','St. Thomas',17.8768,-76.5517,'2025-07-22 23:47:19'),(18,'SBJ 1A Retirement Rd','Kingston',17.9948,-76.7888,'2025-07-22 23:47:20'),(19,'Up Park Camp #1','Kingston',17.9923,-76.7832,'2025-07-22 23:47:20'),(20,'Up Park Camp #2','Kingston',17.9923,-76.7832,'2025-07-22 23:47:20'),(21,'JDF Camp','St. Ann',18.3281,-77.2405,'2025-07-22 23:47:20'),(22,'Up Park Camp #3','Kingston',17.9923,-76.7832,'2025-07-22 23:47:20'),(23,'Black River Branch','St. Elizabeth',18.0335,-77.8567,'2025-07-22 23:47:20'),(24,'10-12E Street','St Catherine',18.0364,-77.0564,'2025-07-22 23:47:20'),(25,'SBJ In Town SuperCenter','St Elizabeth',18.0788,-77.6994,'2025-07-22 23:47:20'),(26,'SBJ New Brunswick #1','St Catherine',18.0364,-77.0564,'2025-07-22 23:47:20'),(27,'SBJ New Brunswick #2','St Catherine',18.0364,-77.0564,'2025-07-22 23:47:20'),(28,'Manor Park Branch','Kingson',18.0519,-76.7897,'2025-07-22 23:47:21'),(29,'LOJ Shopping Centre','St James',18.3923,-77.8596,'2025-07-22 23:47:21'),(30,'Barnett Tech Park','St James',18.4557,-77.916,'2025-07-22 23:47:21'),(31,'SBJ Overton Plaza','St James',18.4744,-77.9182,'2025-07-22 23:47:21'),(32,'Fairview','St James',18.3923,-77.8596,'2025-07-22 23:47:21'),(33,'Portmore Branch','St Catherine',17.9784,-76.8716,'2025-07-22 23:47:21'),(34,'Portmore Town Centre','St Catherine',17.9589,-76.8892,'2025-07-22 23:47:21'),(35,'PriceSmart Portmore','St Catherine',17.959,-76.9017,'2025-07-22 23:47:22'),(36,'Dominica Bank Head Office #1','Kingston',18.0179,-76.8099,'2025-07-22 23:47:22'),(37,'Sagicor Life Head Office','Kingston',18.0082,-76.7877,'2025-07-22 23:47:22'),(38,'SBJ Sovereign Village','St Catherine',17.9616,-76.8975,'2025-07-22 23:47:22'),(39,'85 Constant Spring Road','Kingston',18.0253,-76.7968,'2025-07-22 23:47:22'),(40,'S Foods Supermarket Worthington Ave','Kingston',18.0077,-76.7817,'2025-07-22 23:47:22'),(41,'Dominica Bank Head Office #2','Kingston',18.0179,-76.8099,'2025-07-22 23:47:22'),(42,'Soveriegn Center','Kingston',18.0563,-76.7917,'2025-07-22 23:47:22'),(43,'Sipset Wholesale','Kington',18.0179,-76.8099,'2025-07-22 23:47:22'),(44,'Kingslanding Service Station','St Catherine',18.1341,-77.0214,'2025-07-22 23:47:23'),(45,'Great George Street','Westmoreland',18.215,-78.1337,'2025-07-22 23:47:23'),(46,'SBJ 138 SL UWI','Kingston',18.0017,-76.7439,'2025-07-22 23:47:23'),(47,'Berry-Don','St Catherine',18.1366,-77.0316,'2025-07-22 23:47:23'),(48,'Megamart Bloomfield','Manchester',18.0355,-77.5117,'2025-07-22 23:47:23'),(49,'Central Dealers Mall','Manchester',18.067,-77.5161,'2025-07-22 23:47:23'),(50,'Spauldings','Manchester',18.0312,-77.5046,'2025-07-22 23:47:23');
/*!40000 ALTER TABLE `geocoding_cache` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `geocoding_failures`
--

DROP TABLE IF EXISTS `geocoding_failures`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `geocoding_failures` (
  `id` int NOT NULL AUTO_INCREMENT,
  `atm_id` varchar(50) NOT NULL,
  `location` varchar(255) NOT NULL,
  `parish` varchar(100) NOT NULL,
  `error_message` text,
  `retry_count` int DEFAULT NULL,
  `created_at` datetime DEFAULT NULL,
  `last_retry` datetime DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `geocoding_failures`
--

LOCK TABLES `geocoding_failures` WRITE;
/*!40000 ALTER TABLE `geocoding_failures` DISABLE KEYS */;
/*!40000 ALTER TABLE `geocoding_failures` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2025-07-23  2:04:38
