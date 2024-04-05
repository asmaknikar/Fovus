#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { FovusStack } from '../lib/fovus-stack';

const app = new cdk.App();
new FovusStack(app, 'FovusStack');
